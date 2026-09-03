const orderService = require('../services/order.service');
const { parsePagination } = require('../utils/pagination');

// El Controller SOLO conoce req/res. Nunca importa Mongoose ni el Repository.

class OrderController {
  async getAll(req, res, next) {
    try {
      const { status } = req.query;
      const { page, limit } = parsePagination(req.query);
      const result = await orderService.getAll({ status, page, limit });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await orderService.getById(req.params.id);
      res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const order = await orderService.create(req.body);
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const order = await orderService.updateStatus(req.params.id, req.body.status);
      res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await orderService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrderController();
