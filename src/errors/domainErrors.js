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
};
