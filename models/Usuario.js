const mongoose = require('mongoose');
const crypto = require('crypto');
const { findAvailableSellerSlug } = require('../utils/sellerSlug');

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
    enum: ['admin', 'editor', 'vendedor', 'consulta'],
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
  ultimoAcceso: Date,
  codigoVendedor: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]{6,32}$/
  },
  slugVendedor: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9]{3,32}$/
  }
}, { timestamps: true });

usuarioSchema.index({ estado: 1, createdAt: -1 });
usuarioSchema.index({ rol: 1, estado: 1 });

usuarioSchema.pre('save', async function() {
  if (this.rol === 'vendedor' && !this.codigoVendedor) {
    this.codigoVendedor = `v-${crypto.randomBytes(5).toString('hex')}`;
  }
  if (this.rol === 'vendedor' && !this.slugVendedor) {
    this.slugVendedor = await findAvailableSellerSlug(this.nombre, async candidate => Boolean(
      await this.constructor.exists({ slugVendedor: candidate, _id: { $ne: this._id } })
    ));
  }
});

module.exports = mongoose.model('Usuario', usuarioSchema);
