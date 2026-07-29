const express = require('express');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());
app.use('/api', routes);

// Ruta no encontrada (ningún router la manejó).
app.use((req, res, next) => {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: `La ruta ${req.method} ${req.originalUrl} no existe` },
  });
});

// Middleware global de errores: ÚNICO lugar que arma la respuesta HTTP de error.
app.use(errorMiddleware);

module.exports = app;
