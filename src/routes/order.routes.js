const { Router } = require('express');
const orderController = require('../controllers/order.controller');

const router = Router();

// Las rutas SOLO conectan el path con el método del Controller. Nada más.
router.get('/', orderController.getAll);
router.get('/:id', orderController.getById);
router.post('/', orderController.create);
router.patch('/:id/status', orderController.updateStatus);
router.delete('/:id', orderController.delete);

module.exports = router;
