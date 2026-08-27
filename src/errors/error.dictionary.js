/**
 * Diccionario único de errores conocidos del dominio.
 * Cada entrada define el statusCode HTTP y el mensaje por defecto.
 * Los Services lanzan errores usando estos códigos (ver domainErrors.js);
 * nadie arma un status code "a mano" fuera de este archivo.
 */
const ERROR_DICTIONARY = Object.freeze({
  // Genéricos / recursos no encontrados
  USER_NOT_FOUND: { statusCode: 404, message: 'Usuario no encontrado' },
  PRODUCT_NOT_FOUND: { statusCode: 404, message: 'Producto no encontrado' },
  ORDER_NOT_FOUND: { statusCode: 404, message: 'Pedido no encontrado' },
  DELIVERY_NOT_FOUND: { statusCode: 404, message: 'Entrega no encontrada' },

  // Reglas de negocio / validaciones de dominio
  INVALID_STATUS: { statusCode: 400, message: 'El estado indicado no es válido para esta entidad' },
  INVALID_ROLE: { statusCode: 400, message: 'El rol indicado no es válido' },
  VALIDATION_ERROR: { statusCode: 400, message: 'Los datos enviados no son válidos' },
  FORBIDDEN: { statusCode: 403, message: 'No tenés permisos para realizar esta acción' },

  // Módulo de mocks
  INVALID_MOCK_QUANTITY: {
    statusCode: 400,
    message: 'La cantidad de datos mock solicitada no es válida',
  },

  // Módulo 7: carga de archivos
  FILE_REQUIRED: { statusCode: 400, message: 'Debe adjuntar un archivo' },
  INVALID_FILE_TYPE: { statusCode: 400, message: 'El tipo de archivo no es válido' },
  FILE_TOO_LARGE: { statusCode: 400, message: 'El archivo supera el tamaño máximo permitido' },
  INVALID_FILE_FIELD: {
    statusCode: 400,
    message: 'El campo del archivo enviado no coincide con el esperado',
  },
  INVALID_DOCUMENT_TYPE: { statusCode: 400, message: 'El tipo de documento indicado no es válido' },
  FILE_UPLOAD_ERROR: { statusCode: 500, message: 'Ocurrió un error al guardar el archivo' },

  // Infraestructura
  DATABASE_ERROR: { statusCode: 500, message: 'Ocurrió un error al acceder a la base de datos' },
  INTERNAL_ERROR: { statusCode: 500, message: 'Error interno del servidor' },
});

module.exports = ERROR_DICTIONARY;
