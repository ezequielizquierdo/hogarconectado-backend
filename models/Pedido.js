const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  cotizacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Cotizacion', required: true, unique: true },
  vendedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  comprador: {
    nombre: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    email: { type: String, trim: true }
  },
  productos: [{
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    cantidad: { type: Number, min: 1, required: true },
    marca: String,
    modelo: String,
    precioUnitario: Number,
    subtotal: Number
  }],
  modalidadPago: { type: String, enum: ['contado', 'facturado', '3-cuotas', '6-cuotas'], required: true },
  total: { type: Number, required: true, min: 0 },
  estado: {
    type: String,
    enum: ['reserva-pendiente', 'pago-informado', 'pago-confirmado', 'cancelado', 'vencido'],
    default: 'reserva-pendiente'
  },
  reservadoAt: { type: Date, required: true },
  reservaVenceAt: { type: Date, required: true },
  pagoInformadoAt: Date,
  pagoConfirmadoAt: Date,
  pagoConfirmadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  idempotencyKey: { type: String, required: true, unique: true }
}, { timestamps: true });

pedidoSchema.index({ vendedor: 1, estado: 1, createdAt: -1 });
pedidoSchema.index({ estado: 1, reservaVenceAt: 1 });

module.exports = mongoose.model('Pedido', pedidoSchema);
