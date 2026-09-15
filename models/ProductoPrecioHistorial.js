const mongoose = require('mongoose');

const productoPrecioHistorialSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true, index: true },
  precioAnterior: { type: Number, required: true, min: 0 },
  precioNuevo: { type: Number, required: true, min: 0 },
  cambiadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  origen: { type: String, enum: ['edicion-manual', 'importacion'], default: 'edicion-manual' }
}, { timestamps: true });

productoPrecioHistorialSchema.index({ producto: 1, createdAt: -1 });

module.exports = mongoose.model('ProductoPrecioHistorial', productoPrecioHistorialSchema);
