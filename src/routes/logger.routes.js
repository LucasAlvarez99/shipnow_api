const { Router } = require('express');
const loggerController = require('../controllers/logger.controller');

const router = Router();

// Endpoint interno de diagnóstico (no es una funcionalidad de negocio):
// permite verificar rápidamente que Winston está bien configurado.
router.get('/test', loggerController.test);

module.exports = router;
