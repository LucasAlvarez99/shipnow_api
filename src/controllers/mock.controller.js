const mockService = require('../services/mock.service');

// Igual que el resto: el Controller solo gestiona req/res y llama al Service.
class MockController {
  // GET /api/mocks?users=5&orders=5&deliveries=5
  // Devuelve datos simulados SIN guardarlos en la base.
  preview(req, res, next) {
    try {
      const users = Number(req.query.users) || 5;
      const orders = Number(req.query.orders) || 5;
      const deliveries = Number(req.query.deliveries) || 5;

      const data = mockService.preview({ users, orders, deliveries });
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/mocks/seed  { "users": 5, "orders": 5, "deliveries": 5 }
  // Inserta registros de prueba reales en MongoDB.
  async seed(req, res, next) {
    try {
      const { users = 5, orders = 5, deliveries = 5 } = req.body;
      const result = await mockService.seed({ users, orders, deliveries });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MockController();
