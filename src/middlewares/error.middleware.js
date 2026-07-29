const { AppError, ERROR_DICTIONARY } = require('../errors');

/**
 * Middleware global de errores. ÚNICO lugar del proyecto que arma la
 * respuesta HTTP de un error. Las rutas y controllers nunca responden
 * un error por su cuenta: siempre llaman a next(err) y este middleware
 * decide el formato final.
 *
 * Estructura de respuesta uniforme:
 * {
 *   "error": {
 *     "code": "USER_NOT_FOUND",
 *     "message": "Usuario no encontrado",
 *     "details": { "id": "..." }   // opcional, solo si aplica
 *   }
 * }
 */
function errorMiddleware(err, req, res, next) {
  // Errores de dominio ya vienen con code/statusCode/details listos.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // Errores típicos de Mongoose que no pasaron por un Service (ej: un ID
  // con formato inválido en la URL). Se traducen a una respuesta 400 uniforme.
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'El identificador enviado tiene un formato inválido',
        details: { path: err.path, value: err.value },
      },
    });
  }

  if (err.name === 'ValidationError' && err.errors) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: ERROR_DICTIONARY.VALIDATION_ERROR.message,
        details: Object.keys(err.errors).reduce((acc, key) => {
          acc[key] = err.errors[key].message;
          return acc;
        }, {}),
      },
    });
  }

  // Cualquier otro error no anticipado: se loguea internamente (nunca se
  // expone el stack ni el mensaje real al cliente) y se responde genérico.
  console.error('[Unhandled error]', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: ERROR_DICTIONARY.INTERNAL_ERROR.message,
    },
  });
}

module.exports = errorMiddleware;
