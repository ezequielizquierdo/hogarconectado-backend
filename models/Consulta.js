const mongoose = require('mongoose');

const consultaSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  productoSnapshot: {
    categoria: String,
    marca: { type: String, required: true },
    modelo: { type: String, required: true },
    descripcion: String,
    imagen: String,
    precioContado: Number
  },
  contacto: {
    nombre: { type: String, required: true, trim: true, maxlength: 100 },
    telefono: { type: String, required: true, maxlength: 20 }
  },
  estado: {
    type: String,
    enum: ['nueva', 'en-gestion', 'contactada', 'cerrada'],
    default: 'nueva'
  },
  asignadaA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  atendidaAt: Date,
  cerradaAt: Date,
  historialEstados: [{
    estado: { type: String, enum: ['nueva', 'en-gestion', 'contactada', 'cerrada'], required: true },
    cambiadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    fecha: { type: Date, default: Date.now }
  }],
  origen: {
    type: String,
    enum: ['catalogo-web'],
    default: 'catalogo-web'
  },
  idempotencyKey: { type: String, required: true, unique: true, maxlength: 100 }
}, { timestamps: true });

consultaSchema.index({ estado: 1, createdAt: -1 });
consultaSchema.index({ producto: 1, createdAt: -1 });
consultaSchema.index({ asignadaA: 1, estado: 1 });

module.exports = mongoose.model('Consulta', consultaSchema);
