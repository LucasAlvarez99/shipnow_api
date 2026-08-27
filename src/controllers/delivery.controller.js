const deliveryService = require('../services/delivery.service');
const { deleteUploadedFile } = require('../config/multer.config');

class DeliveryController {
  async getAll(req, res, next) {
    try {
      const { status } = req.query;
      const deliveries = await deliveryService.getAll({ status });
      res.status(200).json(deliveries);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const delivery = await deliveryService.getById(req.params.id);
      res.status(200).json(delivery);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const delivery = await deliveryService.create(req.body);
      res.status(201).json(delivery);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const delivery = await deliveryService.updateStatus(req.params.id, req.body.status);
      res.status(200).json(delivery);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await deliveryService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  // POST /deliveries/:id/proof (multipart/form-data)
  // Mismo criterio que UserController.uploadDocument: si el Service
  // rechaza la operación (entrega inexistente), el archivo que Multer
  // ya guardó en disco se borra para no dejarlo aislado sin asociar.
  async uploadProof(req, res, next) {
    try {
      const delivery = await deliveryService.addProof(req.params.id, req.file);
      res.status(201).json(delivery);
    } catch (err) {
      if (req.file) {
        await deleteUploadedFile(req.file.path);
      }
      next(err);
    }
  }
}

module.exports = new DeliveryController();
