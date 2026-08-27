const { Router } = require('express');
const deliveryController = require('../controllers/delivery.controller');
const { uploadDeliveryProof, handleMulterError } = require('../config/multer.config');

const router = Router();

router.get('/', deliveryController.getAll);
router.get('/:id', deliveryController.getById);
router.post('/', deliveryController.create);
router.patch('/:id/status', deliveryController.updateStatus);
router.delete('/:id', deliveryController.delete);

// Carga de comprobante de entrega (Módulo 7): multipart/form-data con
// campo de archivo "file".
router.post('/:id/proof', uploadDeliveryProof, handleMulterError, deliveryController.uploadProof);

module.exports = router;
