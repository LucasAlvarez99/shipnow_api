const mongoose = require('mongoose');

/**
 * Subdocumento reutilizable con los metadatos de un archivo subido
 * (Módulo 7). Se embebe en los modelos que necesitan asociar archivos
 * a una entidad (User -> documents, Delivery -> proofs).
 *
 * A propósito NO tiene su propio `_id` de colección: no es una entidad
 * independiente, solo información sobre un archivo que vive en el
 * filesystem del servidor. En la base SOLO se guardan estos metadatos;
 * el archivo en sí nunca se guarda en MongoDB.
 */
const fileMetadataSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true }, // nombre con el que lo subió el cliente
    generatedName: { type: String, required: true }, // nombre único generado por Multer en disco
    path: { type: String, required: true }, // ruta relativa al root del proyecto
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    documentType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: false }
);

module.exports = fileMetadataSchema;
