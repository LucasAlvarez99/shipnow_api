const express = require('express');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');
const httpLoggerMiddleware = require('./middlewares/httpLogger.middleware');
const { setupSwagger } = require('./config/swagger.config');
const logger = require('./config/logger.config');

const app = express();

// Límite explícito en el body JSON (Módulo 8): evita que un payload
// gigante se procese entero antes de ser rechazado, consistente con el
// resto de los controles de performance del proyecto (paginación,
// límite de tamaño de archivos en Multer).
app.use(express.json({ limit: '1mb' }));
app.use(httpLoggerMiddleware);
app.use('/api', routes);

// Documentación interactiva (Swagger UI). Toda la configuración vive en
// config/swagger.config.js; acá solo se "engancha" a la app.
//
// A diferencia de /mocks y /logger/test (ver routes/index.js), Swagger
// se mantiene disponible en TODOS los entornos, incluida producción: la
// consigna del Módulo 8 pide explícitamente poder probar Swagger dentro
// del contenedor Docker, y el Dockerfile fija NODE_ENV=production por
// defecto — restringirlo ahí habría hecho que la verificación pedida
// (health check + Swagger + un endpoint principal, todo funcionando en
// el mismo `docker run`) fallara. Es documentación de solo lectura (no
// escribe nada ni ejecuta acciones), así que el riesgo de dejarla
// expuesta es bajo comparado con /mocks/seed (que sí escribe en la base).
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
