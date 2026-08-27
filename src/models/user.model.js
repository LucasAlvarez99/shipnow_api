const mongoose = require('mongoose');
const { USER_ROLES } = require('../constants');
const fileMetadataSchema = require('./fileMetadata.schema');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    // Metadatos de documentos subidos (DNI, licencia, etc. - Módulo 7).
    // El archivo en sí vive en el filesystem, acá solo su información.
    documents: { type: [fileMetadataSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
