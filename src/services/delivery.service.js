const deliveryRepository = require('../repositories/delivery.repository');
const { DELIVERY_STATUS, DELIVERY_DOCUMENT_TYPE } = require('../constants');
const { toRelativePath } = require('../config/multer.config');
const { DeliveryNotFoundError, InvalidStatusError, ValidationError, FileRequiredError } = require('../errors');
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

  // Asocia un comprobante subido (Multer ya lo guardó en disco) a la
  // entrega `id`. Mismo orden de validación que UserService.addDocument:
  // primero que la entidad exista, después que haya llegado un archivo.
  async addProof(deliveryId, file) {
    const delivery = await deliveryRepository.getById(deliveryId);
    if (!delivery) {
      throw new DeliveryNotFoundError(deliveryId);
    }

    if (!file) {
      throw new FileRequiredError();
    }

    const proofMetadata = {
      originalName: file.originalname,
      generatedName: file.filename,
      path: toRelativePath(file.path),
      mimeType: file.mimetype,
      size: file.size,
      documentType: DELIVERY_DOCUMENT_TYPE,
      uploadedAt: new Date(),
    };

    const updated = await deliveryRepository.addProof(deliveryId, proofMetadata);
    logger.info('Comprobante asociado a la entrega correctamente', {
      deliveryId,
      fileName: file.filename,
    });
    return updated;
  }
}

module.exports = new DeliveryService();
