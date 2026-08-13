const orderRepository = require('../repositories/order.repository');
const { ORDER_STATUS, ORDER_PRIORITY } = require('../constants');
const { OrderNotFoundError, InvalidStatusError, ValidationError } = require('../errors');
const logger = require('../config/logger.config');

// Acá vive la lógica de negocio de pedidos. El Service nunca habla con
// Mongoose directamente, siempre pasa por el Repository. Los errores se
// detectan y lanzan ACÁ; la respuesta HTTP la arma solo el middleware global.

class OrderService {
  async getAll({ status } = {}) {
    const filter = status ? { status } : {};
    return orderRepository.getAll(filter);
  }

  async getById(id) {
    const order = await orderRepository.getById(id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }
    return order;
  }

  async create(data) {
    if (!data.user || !Array.isArray(data.items) || data.items.length === 0 || data.totalAmount === undefined) {
      throw new ValidationError({ required: ['user', 'items', 'totalAmount'] });
    }
    if (data.status && !Object.values(ORDER_STATUS).includes(data.status)) {
      throw new InvalidStatusError(data.status, Object.values(ORDER_STATUS));
    }
    if (data.priority && !Object.values(ORDER_PRIORITY).includes(data.priority)) {
      throw new ValidationError({ field: 'priority', allowed: Object.values(ORDER_PRIORITY) });
    }

    const order = await orderRepository.create({
      ...data,
      status: data.status || ORDER_STATUS.PENDING,
      priority: data.priority || ORDER_PRIORITY.MEDIUM,
    });
    logger.info('Pedido creado correctamente', { orderId: order._id.toString() });
    return order;
  }

  async updateStatus(id, status) {
    if (!status || !Object.values(ORDER_STATUS).includes(status)) {
      throw new InvalidStatusError(status, Object.values(ORDER_STATUS));
    }

    const updated = await orderRepository.update(id, { status });
    if (!updated) {
      logger.warning('Intento de actualizar un pedido inexistente', { orderId: id });
      throw new OrderNotFoundError(id);
    }
    logger.info('Estado del pedido actualizado', { orderId: id, status });
    return updated;
  }

  async delete(id) {
    const deleted = await orderRepository.softDelete(id);
    if (!deleted) {
      throw new OrderNotFoundError(id);
    }
    return deleted;
  }
}

module.exports = new OrderService();
