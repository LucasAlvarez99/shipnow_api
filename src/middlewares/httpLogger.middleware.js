const logger = require('../config/logger.config');

/**
 * Deja constancia (nivel "http") de cada request que llega a la API:
 * método, path y status code de la respuesta, junto con cuánto tardó.
 * No reemplaza al middleware global de errores: solo es observabilidad
 * de tráfico, no maneja ni transforma errores.
 */
function httpLoggerMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`);
  });

  next();
}

module.exports = httpLoggerMiddleware;
