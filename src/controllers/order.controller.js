const orderService = require('../services/order.service');

// El Controller SOLO conoce req/res. Nunca importa Mongoose ni el Repository.

class OrderController {
  async getAll(req, res, next) {
    try {
      const { status } = req.query;
      const orders = await orderService.getAll({ status });
      res.status(200).json(orders);
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
