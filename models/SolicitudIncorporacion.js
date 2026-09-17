const mongoose = require('mongoose');

const SolicitudIncorporacionSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['productos', 'vendedor', 'ambos'], required: true, index: true },
  contacto: {
    nombre: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    localidad: { type: String, trim: true },
  },
  productos: {
    descripcion: { type: String, trim: true },
    cantidadAproximada: { type: Number, min: 1, max: 10000 },
  },
  vendedor: {
    canales: [{ type: String, enum: ['whatsapp', 'instagram', 'facebook', 'presencial', 'otro'] }],
    experiencia: { type: String, trim: true },
  },
  mensaje: { type: String, trim: true },
  estado: { type: String, enum: ['nueva', 'contactada', 'aprobada', 'rechazada'], default: 'nueva', index: true },
  notasAdmin: { type: String, trim: true },
  gestionadaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  gestionadaAt: Date,
  idempotencyKey: { type: String, required: true, unique: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model('SolicitudIncorporacion', SolicitudIncorporacionSchema);
