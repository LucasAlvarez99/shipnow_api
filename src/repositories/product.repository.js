const Product = require('../models/product.model');

// El Repository conoce Mongoose. Nadie más en el proyecto debería importar el modelo directamente.
// Encapsula filtros por defecto (ej: no traer productos borrados) y proyecciones.
// NO contiene lógica de negocio (eso vive en el Service).

class ProductRepository {
  async getAll(filter = {}) {
    return Product.find({ isDeleted: false, ...filter }).select('-isDeleted -__v');
  }

  async getById(id) {
    return Product.findOne({ _id: id, isDeleted: false }).select('-isDeleted -__v');
  }

  async create(data) {
    const product = new Product(data);
    return product.save();
  }

  async update(id, data) {
    return Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      data,
      { new: true, runValidators: true }
    ).select('-isDeleted -__v');
  }

  // Borrado lógico, no físico: sigue siendo responsabilidad de acceso a datos.
  async softDelete(id) {
    return Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
  }
}

module.exports = new ProductRepository();
