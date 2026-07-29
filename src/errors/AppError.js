const ERROR_DICTIONARY = require('./error.dictionary');

/**
 * Error base de la aplicación. Todos los errores de dominio heredan de acá.
 * Nunca se instancia directamente desde un Service "a mano" con un mensaje
 * suelto: siempre se usa uno de los códigos definidos en el diccionario,
 * a través de las clases de domainErrors.js.
 */
class AppError extends Error {
  constructor(errorCode, details = null) {
    const entry = ERROR_DICTIONARY[errorCode] || ERROR_DICTIONARY.INTERNAL_ERROR;
    super(entry.message);

    this.name = this.constructor.name;
    this.code = ERROR_DICTIONARY[errorCode] ? errorCode : 'INTERNAL_ERROR';
    this.statusCode = entry.statusCode;
    this.details = details;
    this.isOperational = true; // error esperado del dominio, no un bug

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
