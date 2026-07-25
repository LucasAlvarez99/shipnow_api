const Order = require('../models/order.model');

// Único lugar que conoce Mongoose para Order.
class OrderRepository {
  async getAll(filter = {}) {
    return Order.find({ isDeleted: false, ...filter })
      .populate('user', 'name email role')
      .select('-isDeleted -__v');
  }

  async getById(id) {
    return Order.findOne({ _id: id, isDeleted: false })
      .populate('user', 'name email role')
      .select('-isDeleted -__v');
  }

  async create(data) {
    const order = new Order(data);
    return order.save();
  }

  async insertMany(orders) {
    // Inserción en lote, usada por el módulo de mocking.
    return Order.insertMany(orders);
  }
}

module.exports = new OrderRepository();
