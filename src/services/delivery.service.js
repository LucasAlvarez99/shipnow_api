const deliveryRepository = require('../repositories/delivery.repository');
const { DELIVERY_STATUS } = require('../constants');
const { DeliveryNotFoundError, InvalidStatusError, ValidationError } = require('../errors');
const logger = require('../config/logger.config');

class DeliveryService {
  async getAll({ status } = {}) {
    const filter = status ? { status } : {};
    return deliveryRepository.getAll(filter);
  }

  async getById(id) {
    const delivery = await deliveryRepository.getById(id);
    if (!delivery) {
      throw new DeliveryNotFoundError(id);
    }
    return delivery;
  }

  async create(data) {
    if (!data.order || !data.rider) {
      throw new ValidationError({ required: ['order', 'rider'] });
    }
    if (data.status && !Object.values(DELIVERY_STATUS).includes(data.status)) {
      throw new InvalidStatusError(data.status, Object.values(DELIVERY_STATUS));
    }

    const delivery = await deliveryRepository.create({
      ...data,
      status: data.status || DELIVERY_STATUS.ASSIGNED,
    });
    logger.info('Entrega creada correctamente', { deliveryId: delivery._id.toString() });
    return delivery;
  }

  async updateStatus(id, status) {
    if (!status || !Object.values(DELIVERY_STATUS).includes(status)) {
      throw new InvalidStatusError(status, Object.values(DELIVERY_STATUS));
    }

    const updated = await deliveryRepository.update(id, { status });
    if (!updated) {
      logger.warning('Intento de actualizar una entrega inexistente', { deliveryId: id });
      throw new DeliveryNotFoundError(id);
    }
    logger.info('Estado de la entrega actualizado', { deliveryId: id, status });
    return updated;
  }

  async delete(id) {
    const deleted = await deliveryRepository.softDelete(id);
    if (!deleted) {
      throw new DeliveryNotFoundError(id);
    }
    return deleted;
  }
}

module.exports = new DeliveryService();
