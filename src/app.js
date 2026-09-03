const express = require('express');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');
const httpLoggerMiddleware = require('./middlewares/httpLogger.middleware');
const { setupSwagger } = require('./config/swagger.config');
const logger = require('./config/logger.config');
const env = require('./config/env.config');

const app = express();

// Límite explícito en el body JSON (Módulo 8): evita que un payload
// gigante se procese entero antes de ser rechazado, consistente con el
// resto de los controles de performance del proyecto (paginación,
// límite de tamaño de archivos en Multer).
app.use(express.json({ limit: '1mb' }));
app.use(httpLoggerMiddleware);
app.use('/api', routes);

// Documentación interactiva (Swagger UI). Toda la configuración vive en
// config/swagger.config.js; acá solo se "engancha" a la app. Criterio de
// endpoints internos en producción (Módulo 8, ver también routes/index.js):
// Swagger expone la forma completa de la API (paths, schemas, ejemplos) y
// no aporta nada a un cliente real en producción, así que se desmonta por
// completo cuando NODE_ENV=production — /api/docs cae en el 404 genérico.
if (!env.IS_PRODUCTION) {
  setupSwagger(app);
}

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
