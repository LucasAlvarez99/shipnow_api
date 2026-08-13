const { Router } = require('express');
const deliveryController = require('../controllers/delivery.controller');

const router = Router();

router.get('/', deliveryController.getAll);
router.get('/:id', deliveryController.getById);
router.post('/', deliveryController.create);
router.patch('/:id/status', deliveryController.updateStatus);
router.delete('/:id', deliveryController.delete);

module.exports = router;
