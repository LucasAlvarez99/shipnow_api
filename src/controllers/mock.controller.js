const mockService = require('../services/mock.service');

// Convierte un query param a número solo si vino definido; si no, usa el
// default. Si vino pero no es un número válido, se lo pasamos tal cual
// (NaN) al Service para que la validación lo detecte y responda un error
// claro, en vez de taparlo silenciosamente con el valor por defecto.
function parseQuantity(value, defaultValue) {
  if (value === undefined) return defaultValue;
  return Number(value);
}

// Igual que el resto: el Controller solo gestiona req/res y llama al Service.
// Nunca arma una respuesta de error acá: eso lo hace el middleware global.
class MockController {
  // GET /api/mocks?users=5&orders=5&deliveries=5
  // Devuelve datos simulados SIN guardarlos en la base.
  preview(req, res, next) {
    try {
      const users = parseQuantity(req.query.users, 5);
      const orders = parseQuantity(req.query.orders, 5);
      const deliveries = parseQuantity(req.query.deliveries, 5);

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
      const users = parseQuantity(req.body.users, 5);
      const orders = parseQuantity(req.body.orders, 5);
      const deliveries = parseQuantity(req.body.deliveries, 5);

      const result = await mockService.seed({ users, orders, deliveries });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MockController();
