const Delivery = require('../models/delivery.model');

class DeliveryRepository {
  async getAll(filter = {}) {
    return Delivery.find({ isDeleted: false, ...filter })
      .populate('order')
      .populate('rider', 'name email role')
      .select('-isDeleted -__v');
  }

  async getById(id) {
    return Delivery.findOne({ _id: id, isDeleted: false })
      .populate('order')
      .populate('rider', 'name email role')
      .select('-isDeleted -__v');
  }

  async create(data) {
    const delivery = new Delivery(data);
    return delivery.save();
  }

  async insertMany(deliveries) {
    return Delivery.insertMany(deliveries);
  }
}

module.exports = new DeliveryRepository();
