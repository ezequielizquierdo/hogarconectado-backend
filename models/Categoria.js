const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la categoría es requerido'],
    unique: true,
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  activa: {
    type: Boolean,
    default: true
  },
  icono: {
    type: String,
    default: '📦'
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índices para optimizar búsquedas
categoriaSchema.index({ nombre: 1 });
categoriaSchema.index({ activa: 1 });

module.exports = mongoose.model('Categoria', categoriaSchema);
