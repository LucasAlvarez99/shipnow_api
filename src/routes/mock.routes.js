const { Router } = require('express');
const mockController = require('../controllers/mock.controller');

const router = Router();

// Las rutas solo conectan el path con el método del Controller.
router.get('/', mockController.preview);
router.post('/seed', mockController.seed);

module.exports = router;
