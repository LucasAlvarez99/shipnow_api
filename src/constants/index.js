const PRODUCT_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DISCONTINUED: 'DISCONTINUED',
});

const USER_ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  USER: 'USER',
  DELIVERY: 'DELIVERY', // repartidor
});

const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
});

const ORDER_PRIORITY = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
});

const DELIVERY_STATUS = Object.freeze({
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
});

// Tipos de documento aceptados al subir un archivo asociado a un usuario
// (Módulo 7). "OTRO" cubre cualquier documento que no sea DNI ni licencia
// de un repartidor, sin dejar de pasar por la validación de tipo.
const USER_DOCUMENT_TYPES = Object.freeze({
  DNI: 'DNI',
  LICENCIA: 'LICENCIA',
  OTRO: 'OTRO',
});

// Tipo fijo con el que se guardan los metadatos de un comprobante de
// entrega: a diferencia de los documentos de usuario, acá no lo elige
// quien sube el archivo (siempre es un comprobante de esa entrega).
const DELIVERY_DOCUMENT_TYPE = 'COMPROBANTE_ENTREGA';

// Configuración de carga de archivos (Módulo 7), usada por
// config/multer.config.js. Vive acá, junto al resto de las constantes
// del dominio, para que no haya "números mágicos" sueltos en el código.
const FILE_UPLOAD = Object.freeze({
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  ALLOWED_MIME_TYPES: Object.freeze(['application/pdf', 'image/jpeg', 'image/png']),
  FIELD_NAME: 'file',
});

// Paginación (Módulo 8) para los endpoints que devuelven listas
// (productos, usuarios, pedidos, entregas): nunca se devuelve la
// colección completa sin límite. DEFAULT_LIMIT se aplica cuando no se
// manda `limit`; MAX_LIMIT es el techo aceptado aunque lo pidan más
// grande, para no dejar que un `limit` gigante tire abajo el Event Loop
// ni la memoria del proceso con una sola query.
const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

module.exports = {
  PRODUCT_STATUS,
  USER_ROLES,
  ORDER_STATUS,
  ORDER_PRIORITY,
  DELIVERY_STATUS,
  USER_DOCUMENT_TYPES,
  DELIVERY_DOCUMENT_TYPE,
  FILE_UPLOAD,
  PAGINATION,
};
