const userService = require('../services/user.service');
const { deleteUploadedFile } = require('../config/multer.config');
const { parsePagination } = require('../utils/pagination');

class UserController {
  async getAll(req, res, next) {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await userService.getAll({ page, limit });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getById(req.params.id);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const user = await userService.update(req.params.id, req.body);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await userService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  // POST /users/:id/documents (multipart/form-data)
  // Multer (uploadUserDocument, ver routes/user.routes.js) ya validó el
  // archivo y lo guardó en disco antes de llegar acá. Si el Service
  // rechaza la operación (usuario inexistente, tipo de documento
  // inválido), el archivo ya escrito se borra para no dejarlo huérfano.
  async uploadDocument(req, res, next) {
    try {
      const user = await userService.addDocument(req.params.id, req.file, req.body.documentType);
      res.status(201).json(user);
    } catch (err) {
      if (req.file) {
        await deleteUploadedFile(req.file.path);
      }
      next(err);
    }
  }
}

module.exports = new UserController();
