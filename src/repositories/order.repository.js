const Order = require('../models/order.model');

// Único lugar que conoce Mongoose para Order.
class OrderRepository {
  // Paginado (Módulo 8): nunca devuelve la colección completa sin límite.
  async getAll(filter = {}, { skip = 0, limit = 0 } = {}) {
    const query = { isDeleted: false, ...filter };
    const [items, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email role')
        .select('-isDeleted -__v')
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);
    return { items, total };
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

  async update(id, data) {
    return Order.findOneAndUpdate(
      { _id: id, isDeleted: false },
      data,
      { new: true, runValidators: true }
    )
      .populate('user', 'name email role')
      .select('-isDeleted -__v');
  }

  async softDelete(id) {
    return Order.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
  }

  async insertMany(orders) {
    // Inserción en lote, usada por el módulo de mocking.
    return Order.insertMany(orders);
  }
}

module.exports = new OrderRepository();
