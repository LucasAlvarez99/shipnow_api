const { Router } = require('express');
const healthController = require('../controllers/health.controller');

const router = Router();

// Disponible en TODOS los entornos, incluida producción (a diferencia de
// /mocks y /logger/test): un orquestador necesita poder chequear salud
// del contenedor incluso en prod. Ver criterio de endpoints internos en
// routes/index.js y README.
router.get('/', healthController.check);

module.exports = router;
