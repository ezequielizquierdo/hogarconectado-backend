const mongoose = require('mongoose');

const preciosSnapshotSchema = new mongoose.Schema({
  contado: Number,
  tresCuotas: { total: Number, cuota: Number },
  seisCuotas: { total: Number, cuota: Number }
}, { _id: false });

const cotizacionSchema = new mongoose.Schema({
  datosContacto: {
    nombre: { type: String, required: true },
    telefono: { type: String, required: true },
    email: String
  },
  productos: [{
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    cantidad: { type: Number, min: 1, required: true },
    detalles: {
      categoria: String,
      marca: String,
      modelo: String,
      precioBase: Number,
      precios: preciosSnapshotSchema
    }
  }],
  modalidadPago: {
    type: String,
    enum: ['contado', '3-cuotas', '6-cuotas'],
    default: 'contado'
  },
  totales: {
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  estado: {
    type: String,
    enum: ['pendiente', 'enviada', 'confirmada', 'cancelada'],
    default: 'pendiente'
  },
  observaciones: String,
  creadaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
}, { timestamps: true });

cotizacionSchema.index({ creadaPor: 1, createdAt: -1 });
cotizacionSchema.index({ estado: 1, createdAt: -1 });

cotizacionSchema.methods.calcularTotales = function() {
  const key = this.modalidadPago === '3-cuotas'
    ? ['tresCuotas', 'total']
    : this.modalidadPago === '6-cuotas'
      ? ['seisCuotas', 'total']
      : ['contado'];

  this.totales.subtotal = this.productos.reduce((total, item) => {
    const precios = item.detalles.precios;
    const precio = key.length === 1 ? precios[key[0]] : precios[key[0]][key[1]];
    return total + precio * item.cantidad;
  }, 0);
  this.totales.total = this.totales.subtotal;
  return this.totales;
};

cotizacionSchema.methods.generarMensajeWhatsApp = function() {
  const detalle = this.productos.map(item => (
    `• ${item.detalles.marca} ${item.detalles.modelo} x${item.cantidad}`
  )).join('\n');

  return `🏠 *Hogar Conectado*\n\n*Cotización para ${this.datosContacto.nombre}*\n${detalle}\n\n💰 Total: $${this.totales.total.toLocaleString('es-AR')}\nModalidad: ${this.modalidadPago}\n\n${this.observaciones || ''}`.trim();
};

module.exports = mongoose.model('Cotizacion', cotizacionSchema);
