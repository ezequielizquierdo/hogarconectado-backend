const mongoose = require('mongoose');

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
  imagenes: [{
    url: String,
    alt: String,
    principal: { type: Boolean, default: false }
  }],
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
  timestamps: true
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

// Método virtual para obtener precio con ganancia
productoSchema.virtual('precioConGanancia').get(function() {
  const ganancia = process.env.GANANCIA_DEFAULT || 0.30;
  return this.precioBase * (1 + ganancia);
});

// Método para calcular precio en cuotas
productoSchema.methods.calcularCuotas = function() {
  const precioConGanancia = this.precioBase * (1 + (process.env.GANANCIA_DEFAULT || 0.30));
  const factor3 = parseFloat(process.env.FACTOR_3_CUOTAS) || 1.1298;
  const factor6 = parseFloat(process.env.FACTOR_6_CUOTAS) || 1.2138;
  
  return {
    contado: precioConGanancia,
    tresCuotas: {
      total: precioConGanancia * factor3,
      cuota: (precioConGanancia * factor3) / 3
    },
    seisCuotas: {
      total: precioConGanancia * factor6,
      cuota: (precioConGanancia * factor6) / 6
    }
  };
};

module.exports = mongoose.model('Producto', productoSchema);
