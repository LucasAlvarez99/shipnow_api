const productRepository = require('../repositories/product.repository');
const { PRODUCT_STATUS } = require('../constants');

// Acá vive la lógica de negocio: qué mostrar, qué calcular, qué validar.
// El Service NUNCA habla con Mongoose directamente, siempre pasa por el Repository.

class ProductService {
  async getAll({ onlyAvailable } = {}) {
    const filter = onlyAvailable ? { status: PRODUCT_STATUS.AVAILABLE } : {};
    return productRepository.getAll(filter);
  }

  async getById(id) {
    const product = await productRepository.getById(id);
    if (!product) {
      const error = new Error('Producto no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  async create(data) {
    // Regla de negocio: si no hay stock al crear, el estado inicial es OUT_OF_STOCK.
    const status = data.stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
    return productRepository.create({ ...data, status });
  }

  async update(id, data) {
    // Regla de negocio: si actualizan el stock a 0, el estado pasa a OUT_OF_STOCK automáticamente.
    if (data.stock !== undefined) {
      data.status = data.stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
    }
    const updated = await productRepository.update(id, data);
    if (!updated) {
      const error = new Error('Producto no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await productRepository.softDelete(id);
    if (!deleted) {
      const error = new Error('Producto no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return deleted;
  }
}

module.exports = new ProductService();
