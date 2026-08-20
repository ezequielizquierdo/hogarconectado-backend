const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  foto: String,
  rol: {
    type: String,
    enum: ['admin', 'editor', 'consulta'],
    default: 'consulta'
  },
  estado: {
    type: String,
    enum: ['pendiente', 'activo', 'bloqueado'],
    default: 'pendiente'
  },
  aprobadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  aprobadoEn: Date,
  ultimoAcceso: Date
}, { timestamps: true });

usuarioSchema.index({ estado: 1, createdAt: -1 });
usuarioSchema.index({ rol: 1, estado: 1 });

module.exports = mongoose.model('Usuario', usuarioSchema);
