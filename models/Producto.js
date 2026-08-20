const mongoose = require('mongoose');
const { calculatePrices, getPricingConfig } = require('../utils/pricing');

const productoSchema = new mongoose.Schema({
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: [true, 'La categoría es requerida']
  },
  marca: {
    type: String,
    required: [true, 'La marca es requerida'],
    trim: true,
    maxlength: [100, 'La marca no puede exceder 100 caracteres']
  },
  modelo: {
    type: String,
    required: [true, 'El modelo es requerido'],
    trim: true,
    maxlength: [200, 'El modelo no puede exceder 200 caracteres']
  },
  precioBase: {
    type: Number,
    required: [true, 'El precio base es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  imagenes: [String], // Array de URLs de imágenes
  imagenPublicIds: [String], // Identificadores para reemplazo y eliminación
  especificaciones: {
    tipo: String,
    color: String,
    dimensiones: String,
    peso: String,
    garantia: String,
    otros: mongoose.Schema.Types.Mixed
  },
  stock: {
    cantidad: { type: Number, default: 0 },
    disponible: { type: Boolean, default: true }
  },
  activo: {
    type: Boolean,
    default: true
  },
  tags: [String] // Para búsquedas
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar búsquedas
productoSchema.index({ categoria: 1 });
productoSchema.index({ marca: 1 });
productoSchema.index({ modelo: 1 });
productoSchema.index({ activo: 1 });
productoSchema.index({ 'stock.disponible': 1 });

// Índice de texto completo para búsquedas
productoSchema.index({
  marca: 'text',
  modelo: 'text',
  descripcion: 'text',
  tags: 'text'
});

// Virtual para nombre completo (marca + modelo)
productoSchema.virtual('nombre').get(function() {
  return `${this.marca} ${this.modelo}`;
});

// Método virtual para obtener precio con ganancia
productoSchema.virtual('precioConGanancia').get(function() {
  return calculatePrices(this.precioBase, getPricingConfig(process.env)).contado;
});

// Método para calcular precio en cuotas
productoSchema.methods.calcularCuotas = function() {
  return calculatePrices(this.precioBase, getPricingConfig(process.env));
};

module.exports = mongoose.model('Producto', productoSchema);
