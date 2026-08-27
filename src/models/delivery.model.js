const mongoose = require('mongoose');
const { DELIVERY_STATUS } = require('../constants');
const fileMetadataSchema = require('./fileMetadata.schema');

const deliverySchema = new mongoose.Schema(
  {
    // Relación entrega ↔ pedido
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    // Relación entrega ↔ repartidor (un User con role DELIVERY)
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(DELIVERY_STATUS),
      default: DELIVERY_STATUS.ASSIGNED,
    },
    estimatedDeliveryAt: { type: Date },
    // Metadatos de comprobantes de entrega subidos (Módulo 7). Es un
    // array (no un único campo) porque una entrega puede necesitar más
    // de un comprobante (ej: reintento tras una entrega fallida).
    proofs: { type: [fileMetadataSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Delivery', deliverySchema);
