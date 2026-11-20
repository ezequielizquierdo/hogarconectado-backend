const mongoose = require('mongoose');
const { calculatePrices, getProductPricingConfig } = require('../utils/pricing');

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
  precioGenius: {
    type: Number,
    min: [0, 'El precio Genius no puede ser negativo']
  },
  moneda: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [10, 'La moneda no puede exceder 10 caracteres'],
    default: 'ARS'
  },
  propietario: {
    type: String,
    trim: true,
    maxlength: [100, 'El propietario no puede exceder 100 caracteres']
  },
  porcentajeGanancia: {
    type: Number,
    min: [0, 'El porcentaje no puede ser negativo'],
    max: [100, 'El porcentaje no puede superar 100']
  },
  descuento: {
    activo: { type: Boolean, default: false },
    porcentaje: { type: Number, min: 0, max: 90, default: 0 },
    desde: Date,
    hasta: Date
  },
  tipoComercializacion: {
    type: String,
    enum: ['stock-propio', 'producto-tercero', 'venta-catalogo'],
    default: 'stock-propio',
    index: true
  },
  catalogo: {
    nombre: {
      type: String,
      trim: true,
      required: [function() {
        return this.tipoComercializacion === 'venta-catalogo';
      }, 'El nombre del catálogo es requerido para una venta por catálogo'],
      maxlength: [100, 'El nombre del catálogo no puede exceder 100 caracteres']
    },
    campania: {
      type: String,
      trim: true,
      maxlength: [100, 'La campaña no puede exceder 100 caracteres']
    },
    vigenciaHasta: Date,
    plazoEntrega: {
      type: String,
      trim: true,
      maxlength: [120, 'El plazo de entrega no puede exceder 120 caracteres']
    }
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
  nuevoIngreso: {
    activo: { type: Boolean, default: false },
    tipo: {
      type: String,
      enum: ['alta', 'reposicion']
    },
    detectadoEn: Date
  },
  sincronizacionGenius: {
    clave: { type: String, trim: true },
    filaOrigen: Number,
    fechaPrecio: Date,
    fechaIngreso: Date,
    controlStock: Date,
    stockInformado: Number,
    reservadoInformado: Number,
    ingresoInformado: Number,
    deposito: { type: String, trim: true },
    iva: Number,
    observaciones: { type: String, trim: true },
    presenteEnUltimaPlanilla: { type: Boolean, default: true },
    ultimaSincronizacion: Date,
    noEncontradoDesde: Date
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
productoSchema.index({ activo: 1, 'nuevoIngreso.activo': 1 });
productoSchema.index({ activo: 1, createdAt: -1 });
productoSchema.index({ activo: 1, updatedAt: -1 });
productoSchema.index({ 'sincronizacionGenius.clave': 1 }, { sparse: true });
productoSchema.index({ propietario: 1, 'sincronizacionGenius.presenteEnUltimaPlanilla': 1 });

productoSchema.pre('validate', function(next) {
  if (this.tipoComercializacion === 'venta-catalogo' && !this.catalogo?.nombre?.trim()) {
    this.invalidate('catalogo.nombre', 'El nombre del catálogo es requerido para una venta por catálogo');
  }
  next();
});

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
  return this.calcularCuotas().contado;
});

productoSchema.virtual('porcentajeGananciaAplicado').get(function() {
  return getProductPricingConfig(
    this.porcentajeGanancia,
    process.env
  ).ganancia * 100;
});

// Método para calcular precio en cuotas
productoSchema.methods.calcularCuotas = function() {
  const descuentoVigente = this.descuento?.activo
    && (!this.descuento.desde || this.descuento.desde <= new Date())
    && (!this.descuento.hasta || this.descuento.hasta >= new Date())
    ? Number(this.descuento.porcentaje || 0)
    : 0;
  return calculatePrices(
    this.precioBase,
    { ...getProductPricingConfig(this.porcentajeGanancia, process.env), descuentoPorcentaje: descuentoVigente }
  );
};

module.exports = mongoose.model('Producto', productoSchema);
