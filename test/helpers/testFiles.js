// Helpers para generar contenido de archivo en memoria para los tests de
// carga (Módulo 7). No se escriben archivos temporales en disco para el
// input: supertest permite adjuntar un Buffer directamente con `.attach()`.
// Los archivos que SÍ terminan en disco son los que genera la propia app
// (Multer) al procesar el request; esos se limpian con `cleanupUploadedFile`.

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');

function validPdfBuffer() {
  // No hace falta un PDF "real" y completo: al fileFilter de Multer solo
  // le importa el mimetype declarado en el multipart (ver `contentType`
  // al usar este buffer con supertest), no el contenido del archivo.
  return Buffer.from('%PDF-1.4 contenido de prueba para el test\n%%EOF');
}

function oversizedBuffer(sizeInBytes) {
  return Buffer.alloc(sizeInBytes, 'a');
}

// Borra un archivo que la app haya guardado en `uploads/`, referenciado
// por su ruta relativa (tal como se guarda en los metadatos). Se usa en
// los tests para no ir dejando archivos de prueba acumulados en disco.
async function cleanupUploadedFile(relativePath) {
  if (!relativePath) return;
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  try {
    await fs.promises.unlink(absolutePath);
  } catch (err) {
    // Si el archivo ya no está (por ejemplo, porque el propio código de
    // la app ya lo borró al validar un error), no es un problema del test.
    if (err.code !== 'ENOENT') throw err;
  }
}

module.exports = {
  validPdfBuffer,
  oversizedBuffer,
  cleanupUploadedFile,
};
