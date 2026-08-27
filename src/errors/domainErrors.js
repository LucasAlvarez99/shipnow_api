const AppError = require('./AppError');

class UserNotFoundError extends AppError {
  constructor(id) {
    super('USER_NOT_FOUND', { id });
  }
}

class ProductNotFoundError extends AppError {
  constructor(id) {
    super('PRODUCT_NOT_FOUND', { id });
  }
}

class OrderNotFoundError extends AppError {
  constructor(id) {
    super('ORDER_NOT_FOUND', { id });
  }
}

class DeliveryNotFoundError extends AppError {
  constructor(id) {
    super('DELIVERY_NOT_FOUND', { id });
  }
}

class InvalidStatusError extends AppError {
  constructor(status, allowedValues = []) {
    super('INVALID_STATUS', { received: status, allowed: allowedValues });
  }
}

class InvalidRoleError extends AppError {
  constructor(role, allowedValues = []) {
    super('INVALID_ROLE', { received: role, allowed: allowedValues });
  }
}

class ValidationError extends AppError {
  constructor(details) {
    super('VALIDATION_ERROR', details);
  }
}

class ForbiddenError extends AppError {
  constructor(details) {
    super('FORBIDDEN', details);
  }
}

// Específico del módulo de mocks: cantidad inválida (negativa, no numérica, o fuera de rango).
class InvalidMockQuantityError extends AppError {
  constructor(field, value) {
    super('INVALID_MOCK_QUANTITY', {
      field,
      received: value,
      rule: 'Debe ser un entero entre 1 y 50',
    });
  }
}

// Falla real de MongoDB/Mongoose durante una operación (ej: al insertar mocks en lote).
class DatabaseError extends AppError {
  constructor(originalMessage) {
    super('DATABASE_ERROR', { originalMessage });
  }
}

// --- Módulo 7: carga de archivos ---

// No llegó ningún archivo en el campo esperado del multipart/form-data.
class FileRequiredError extends AppError {
  constructor() {
    super('FILE_REQUIRED');
  }
}

// El archivo llegó, pero su mimetype no está en la lista de permitidos
// (lo detecta el fileFilter de Multer, ver config/multer.config.js).
class InvalidFileTypeError extends AppError {
  constructor(received, allowedValues = []) {
    super('INVALID_FILE_TYPE', { received, allowed: allowedValues });
  }
}

// Superó el tamaño máximo configurado en los `limits` de Multer.
class FileTooLargeError extends AppError {
  constructor(maxSizeBytes) {
    super('FILE_TOO_LARGE', { maxSizeBytes });
  }
}

// El archivo llegó en un campo (`fieldname`) distinto al que espera el
// endpoint (Multer lo reporta como LIMIT_UNEXPECTED_FILE).
class InvalidFileFieldError extends AppError {
  constructor(expectedField, receivedField) {
    super('INVALID_FILE_FIELD', { expectedField, received: receivedField });
  }
}

// El `documentType` enviado no pertenece al enum permitido para documentos de usuario.
class InvalidDocumentTypeError extends AppError {
  constructor(received, allowedValues = []) {
    super('INVALID_DOCUMENT_TYPE', { received, allowed: allowedValues });
  }
}

// Multer terminó de procesar el archivo pero algo falló al persistirlo
// (error de disco, permisos, etc.), o cualquier otro MulterError no
// contemplado por los casos anteriores.
class FileUploadError extends AppError {
  constructor(originalMessage) {
    super('FILE_UPLOAD_ERROR', { originalMessage });
  }
}

module.exports = {
  UserNotFoundError,
  ProductNotFoundError,
  OrderNotFoundError,
  DeliveryNotFoundError,
  InvalidStatusError,
  InvalidRoleError,
  ValidationError,
  ForbiddenError,
  InvalidMockQuantityError,
  DatabaseError,
  FileRequiredError,
  InvalidFileTypeError,
  FileTooLargeError,
  InvalidFileFieldError,
  InvalidDocumentTypeError,
  FileUploadError,
};
