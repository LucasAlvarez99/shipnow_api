const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { FILE_UPLOAD } = require('../constants');
const {
  InvalidFileTypeError,
  FileTooLargeError,
  InvalidFileFieldError,
  FileUploadError,
} = require('../errors');
const logger = require('./logger.config');

/**
 * Configuración centralizada de Multer (Módulo 7). ÚNICO lugar del
 * proyecto que sabe dónde se guardan los archivos, cómo se nombran, qué
 * tipos se aceptan, el tamaño máximo permitido y cómo se traducen los
 * errores de carga al formato de error del proyecto. Las rutas solo
 * importan y usan los middlewares que este archivo exporta: nunca arman
 * su propia instancia de Multer.
 *
 * Estructura de carpetas de uploads (fuera de `src/`, en la raíz del
 * proyecto, y listada en .gitignore: ver "Qué evitar" de la consigna):
 *   uploads/
 *     documentos-usuario/  -> documentos de un usuario (DNI, licencia, etc.)
 *     comprobantes-entrega/ -> comprobantes asociados a una entrega
 */
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const UPLOADS_ROOT = path.join(PROJECT_ROOT, 'uploads');
const DIRS = Object.freeze({
  USER_DOCUMENTS: path.join(UPLOADS_ROOT, 'documentos-usuario'),
  DELIVERY_PROOFS: path.join(UPLOADS_ROOT, 'comprobantes-entrega'),
});

// Se crean al cargar el módulo (una sola vez, al arrancar la app) para
// que Multer nunca falle por intentar escribir en una carpeta inexistente.
Object.values(DIRS).forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

// Nombre único en disco: timestamp + bytes random + extensión original.
// Nunca se reutiliza el nombre original (podría pisar otro archivo o
// traer caracteres problemáticos para el filesystem).
function generateFileName(originalName) {
  const ext = path.extname(originalName);
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  return `${uniqueSuffix}${ext}`;
}

function buildStorage(destinationDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, destinationDir),
    filename: (req, file, cb) => cb(null, generateFileName(file.originalname)),
  });
}

// Rechaza cualquier mimetype fuera de la lista permitida. Se loguea acá
// (y no en el Service) porque el intento ocurre durante el parseo del
// multipart, antes de que el archivo llegue a ninguna otra capa.
function fileFilter(req, file, cb) {
  if (!FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    logger.warning('Intento de subir un tipo de archivo no permitido', {
      mimetype: file.mimetype,
      originalName: file.originalname,
    });
    return cb(new InvalidFileTypeError(file.mimetype, FILE_UPLOAD.ALLOWED_MIME_TYPES));
  }
  return cb(null, true);
}

const commonOptions = {
  fileFilter,
  limits: { fileSize: FILE_UPLOAD.MAX_FILE_SIZE_BYTES },
};

// Middleware para POST /api/users/:id/documents
const uploadUserDocument = multer({
  storage: buildStorage(DIRS.USER_DOCUMENTS),
  ...commonOptions,
}).single(FILE_UPLOAD.FIELD_NAME);

// Middleware para POST /api/deliveries/:id/proof
const uploadDeliveryProof = multer({
  storage: buildStorage(DIRS.DELIVERY_PROOFS),
  ...commonOptions,
}).single(FILE_UPLOAD.FIELD_NAME);

/**
 * Manejo de errores de carga, centralizado acá (y no repetido en cada
 * controller). Se ubica en la cadena de middlewares justo después del
 * middleware de Multer de cada ruta: si Multer llama a next(err), este
 * middleware traduce el error a un AppError del proyecto y lo reenvía
 * con next(); si Multer no falló, Express lo salta (es un middleware de
 * 4 argumentos) y sigue derecho al controller.
 */
function handleMulterError(err, req, res, next) {
  if (!err) return next();

  // Ya es uno de nuestros errores de dominio (ej: InvalidFileTypeError
  // lanzado desde el fileFilter): se reenvía tal cual.
  if (err.isOperational) return next(err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new FileTooLargeError(FILE_UPLOAD.MAX_FILE_SIZE_BYTES));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new InvalidFileFieldError(FILE_UPLOAD.FIELD_NAME, err.field));
    }
    return next(new FileUploadError(err.message));
  }

  // Cualquier otro error inesperado al guardar (ej: falla de disco).
  return next(new FileUploadError(err.message));
}

// Borra un archivo ya guardado en disco cuando una validación posterior
// (usuario/entrega inexistente, documentType inválido) falla y no
// queremos dejarlo huérfano, sin asociar a ninguna entidad.
async function deleteUploadedFile(filePath) {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    // Si ya no existe, no es un problema real; cualquier otra falla se
    // registra pero no se propaga (no queremos tapar el error original).
    if (err.code !== 'ENOENT') {
      logger.error(`No se pudo eliminar el archivo huérfano ${filePath}: ${err.message}`, {
        stack: err.stack,
      });
    }
  }
}

// Convierte una ruta absoluta en disco a una ruta relativa a la raíz del
// proyecto (ej: "uploads/documentos-usuario/169...-abc.pdf"), para no
// guardar en la base rutas absolutas que dependen de dónde está
// desplegado el proyecto.
function toRelativePath(absolutePath) {
  return path.relative(PROJECT_ROOT, absolutePath).split(path.sep).join('/');
}

module.exports = {
  UPLOADS_ROOT,
  DIRS,
  uploadUserDocument,
  uploadDeliveryProof,
  handleMulterError,
  deleteUploadedFile,
  toRelativePath,
};
