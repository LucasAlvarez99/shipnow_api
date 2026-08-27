const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { uploadUserDocument, handleMulterError } = require('../config/multer.config');

const router = Router();

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

// Carga de documentos de usuario (Módulo 7): multipart/form-data con
// campo de archivo "file" + campo de texto "documentType".
router.post('/:id/documents', uploadUserDocument, handleMulterError, userController.uploadDocument);

module.exports = router;
