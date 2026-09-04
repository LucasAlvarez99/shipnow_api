const { Router } = require('express');
const productRoutes = require('./product.routes');
const userRoutes = require('./user.routes');
const orderRoutes = require('./order.routes');
const deliveryRoutes = require('./delivery.routes');
const mockRoutes = require('./mock.routes');
const loggerRoutes = require('./logger.routes');
const healthRoutes = require('./health.routes');
const env = require('../config/env.config');

const router = Router();

router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/deliveries', deliveryRoutes);

// Health check: disponible en TODO entorno, incluida producción.
router.use('/health', healthRoutes);

// Criterio de endpoints internos en producción (Módulo 8): /mocks y
// /logger/test son herramientas de diagnóstico y de generación de datos
// de prueba, no funcionalidad de negocio de ShipNow. /mocks/seed en
// particular ESCRIBE en la base, así que dejarlo accesible en producción
// sería peligroso (cualquiera podría poblarla con datos falsos). Por eso
// ambos se desmontan por completo cuando NODE_ENV=production: una
// request a /api/mocks o /api/logger/test en prod cae en el 404
// genérico de ruta no encontrada (app.js), sin revelar que alguna vez
// existieron. Fuera de producción (development/test) siguen disponibles
// sin restricciones.
//
// Swagger UI NO sigue este mismo criterio (queda disponible en todo
// entorno): es de solo lectura, no escribe nada, y la consigna pide
// poder probarlo dentro del contenedor Docker. Ver el porqué en app.js.
if (!env.IS_PRODUCTION) {
  router.use('/mocks', mockRoutes);
  router.use('/logger', loggerRoutes);
}

module.exports = router;
