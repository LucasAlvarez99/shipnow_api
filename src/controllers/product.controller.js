const productService = require('../services/product.service');

// El Controller SOLO conoce req/res. Nunca importa Mongoose ni el Repository.

class ProductController {
  async getAll(req, res, next) {
    try {
      const onlyAvailable = req.query.onlyAvailable === 'true';
      const products = await productService.getAll({ onlyAvailable });
      res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await productService.getById(req.params.id);
      res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const product = await productService.create(req.body);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const product = await productService.update(req.params.id, req.body);
      res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await productService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductController();
