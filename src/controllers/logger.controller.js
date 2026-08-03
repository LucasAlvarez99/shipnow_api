const logger = require('../config/logger.config');

// Controller interno, SOLO para validar la configuración del logger.
// No representa una funcionalidad real del negocio de ShipNow.
class LoggerController {
  // GET /api/logger/test
  // Dispara un log de cada nivel definido para poder revisar rápidamente
  // que todos aparecen donde corresponde (consola y logs/error-*.log).
  test(req, res) {
    logger.debug('[test] nivel debug: detalle interno útil solo en desarrollo');
    logger.http(`[test] nivel http: ${req.method} ${req.originalUrl}`);
    logger.info('[test] nivel info: evento informativo general de la aplicación');
    logger.warning('[test] nivel warning: situación inesperada pero no crítica');
    logger.error('[test] nivel error: error simulado para validar la configuración');
    logger.fatal('[test] nivel fatal: falla crítica simulada para validar la configuración');

    res.status(200).json({
      message: 'Se generaron logs de prueba en los 6 niveles: debug, http, info, warning, error, fatal',
      revisar: {
        consola: 'Todos los niveles en desarrollo; solo info/warning/error/fatal en producción',
        archivo: 'logs/error-YYYY-MM-DD.log debería tener SOLO las líneas de error y fatal de esta prueba',
      },
    });
  }
}

module.exports = new LoggerController();
