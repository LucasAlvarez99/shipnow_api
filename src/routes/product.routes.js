const { Router } = require('express');
const productController = require('../controllers/product.controller');

const router = Router();

// Las rutas SOLO conectan el path con el método del Controller. Nada más.
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);

module.exports = router;
