const productRepository = require('../repositories/product.repository');
const { PRODUCT_STATUS } = require('../constants');
const { ProductNotFoundError, InvalidStatusError, ValidationError } = require('../errors');

// Acá vive la lógica de negocio: qué mostrar, qué calcular, qué validar.
// El Service NUNCA habla con Mongoose directamente, siempre pasa por el Repository.
// Los errores se detectan y lanzan ACÁ; la respuesta HTTP la arma solo el middleware global.

class ProductService {
  async getAll({ onlyAvailable } = {}) {
    const filter = onlyAvailable ? { status: PRODUCT_STATUS.AVAILABLE } : {};
    return productRepository.getAll(filter);
  }

  async getById(id) {
    const product = await productRepository.getById(id);
    if (!product) {
      throw new ProductNotFoundError(id);
    }
    return product;
  }

  async create(data) {
    if (data.status && !Object.values(PRODUCT_STATUS).includes(data.status)) {
      throw new InvalidStatusError(data.status, Object.values(PRODUCT_STATUS));
    }
    if (data.price === undefined || data.stock === undefined || !data.name) {
      throw new ValidationError({ required: ['name', 'price', 'stock'] });
    }

    // Regla de negocio: si no hay stock al crear, el estado inicial es OUT_OF_STOCK.
    const status = data.stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
    return productRepository.create({ ...data, status });
  }

  async update(id, data) {
    if (data.status && !Object.values(PRODUCT_STATUS).includes(data.status)) {
      throw new InvalidStatusError(data.status, Object.values(PRODUCT_STATUS));
    }

    // Regla de negocio: si actualizan el stock a 0, el estado pasa a OUT_OF_STOCK automáticamente.
    if (data.stock !== undefined) {
      data.status = data.stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
    }
    const updated = await productRepository.update(id, data);
    if (!updated) {
      throw new ProductNotFoundError(id);
    }
    return updated;
  }

  async delete(id) {
    const deleted = await productRepository.softDelete(id);
    if (!deleted) {
      throw new ProductNotFoundError(id);
    }
    return deleted;
  }
}

module.exports = new ProductService();
