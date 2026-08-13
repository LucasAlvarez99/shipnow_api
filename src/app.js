const express = require('express');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');
const httpLoggerMiddleware = require('./middlewares/httpLogger.middleware');
const { setupSwagger } = require('./config/swagger.config');
const logger = require('./config/logger.config');

const app = express();

app.use(express.json());
app.use(httpLoggerMiddleware);
app.use('/api', routes);

// Documentación interactiva (Swagger UI). Toda la configuración vive en
// config/swagger.config.js; acá solo se "engancha" a la app.
setupSwagger(app);

// Ruta no encontrada (ningún router la manejó).
app.use((req, res, next) => {
  logger.warning(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    path: req.originalUrl,
  });
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: `La ruta ${req.method} ${req.originalUrl} no existe` },
  });
});

// Middleware global de errores: ÚNICO lugar que arma la respuesta HTTP de error.
app.use(errorMiddleware);

module.exports = app;
