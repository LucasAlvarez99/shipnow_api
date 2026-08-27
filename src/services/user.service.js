const userRepository = require('../repositories/user.repository');
const { USER_ROLES, USER_DOCUMENT_TYPES } = require('../constants');
const { toRelativePath } = require('../config/multer.config');
const {
  UserNotFoundError,
  ForbiddenError,
  ValidationError,
  FileRequiredError,
  InvalidDocumentTypeError,
} = require('../errors');
const logger = require('../config/logger.config');

class UserService {
  async getAll() {
    return userRepository.getAll();
  }

  async getById(id) {
    const user = await userRepository.getById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    return user;
  }

  async create(data) {
    if (!data.name || !data.email || !data.password) {
      throw new ValidationError({ required: ['name', 'email', 'password'] });
    }

    // Regla de negocio: si no se especifica rol, se asigna USER por defecto (nunca ADMIN por default).
    const role = data.role === USER_ROLES.ADMIN ? USER_ROLES.ADMIN : USER_ROLES.USER;
    return userRepository.create({ ...data, role });
  }

  async update(id, data) {
    const updated = await userRepository.update(id, data);
    if (!updated) {
      throw new UserNotFoundError(id);
    }
    return updated;
  }

  async delete(id) {
    const deleted = await userRepository.softDelete(id);
    if (!deleted) {
      throw new UserNotFoundError(id);
    }
    return deleted;
  }

  // Ejemplo de lógica de negocio que NO debe vivir en el Repository: validar permisos.
  assertIsAdmin(user) {
    if (user.role !== USER_ROLES.ADMIN) {
      throw new ForbiddenError({ requiredRole: USER_ROLES.ADMIN });
    }
  }

  // Asocia un documento subido (Multer ya lo guardó en disco) al usuario
  // `id`. Orden de validación: 1) el usuario existe, 2) llegó un
  // archivo, 3) el tipo de documento es válido. Si algo de esto falla
  // DESPUÉS de que Multer ya escribió el archivo en disco, el Controller
  // es quien lo borra (ver user.controller.js) para no dejarlo huérfano.
  async addDocument(userId, file, documentType) {
    const user = await userRepository.getById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (!file) {
      throw new FileRequiredError();
    }

    if (!Object.values(USER_DOCUMENT_TYPES).includes(documentType)) {
      throw new InvalidDocumentTypeError(documentType, Object.values(USER_DOCUMENT_TYPES));
    }

    const documentMetadata = {
      originalName: file.originalname,
      generatedName: file.filename,
      path: toRelativePath(file.path),
      mimeType: file.mimetype,
      size: file.size,
      documentType,
      uploadedAt: new Date(),
    };

    const updated = await userRepository.addDocument(userId, documentMetadata);
    logger.info('Documento de usuario cargado correctamente', {
      userId,
      documentType,
      fileName: file.filename,
    });
    return updated;
  }
}

module.exports = new UserService();
