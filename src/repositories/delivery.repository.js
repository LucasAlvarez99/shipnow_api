const Delivery = require('../models/delivery.model');

class DeliveryRepository {
  // Paginado (Módulo 8): nunca devuelve la colección completa sin límite.
  async getAll(filter = {}, { skip = 0, limit = 0 } = {}) {
    const query = { isDeleted: false, ...filter };
    const [items, total] = await Promise.all([
      Delivery.find(query)
        .populate('order')
        .populate('rider', 'name email role')
        .select('-isDeleted -__v')
        .skip(skip)
        .limit(limit),
      Delivery.countDocuments(query),
    ]);
    return { items, total };
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

  async update(id, data) {
    return Delivery.findOneAndUpdate(
      { _id: id, isDeleted: false },
      data,
      { new: true, runValidators: true }
    )
      .populate('order')
      .populate('rider', 'name email role')
      .select('-isDeleted -__v');
  }

  async softDelete(id) {
    return Delivery.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
  }

  async insertMany(deliveries) {
    return Delivery.insertMany(deliveries);
  }

  // Agrega un metadato de archivo al array `proofs` de la entrega
  // (Módulo 7), igual que addDocument en UserRepository: $push atómico
  // en vez de traer + guardar.
  async addProof(id, proofMetadata) {
    return Delivery.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $push: { proofs: proofMetadata } },
      { new: true, runValidators: true }
    )
      .populate('order')
      .populate('rider', 'name email role')
      .select('-isDeleted -__v');
  }
}

module.exports = new DeliveryRepository();
