const mongoose = require('mongoose');

const preciosSnapshotSchema = new mongoose.Schema({
  contado: Number,
  factura: { costoBase: Number, unPago: Number },
  tresCuotas: { costoBase: Number, total: Number, cuota: Number },
  seisCuotas: { costoBase: Number, total: Number, cuota: Number }
}, { _id: false });

function getSelectedUnitPrice(item, modalidadPago) {
  const detalles = item?.detalles || {};
  const precios = detalles.precios || {};
  const contado = Number(precios.contado ?? detalles.precioVenta ?? detalles.precioBase ?? 0);
  if (modalidadPago === 'facturado') return Number(precios.factura?.unPago ?? contado);
  if (modalidadPago === '3-cuotas') return Number(precios.tresCuotas?.total ?? contado);
  if (modalidadPago === '6-cuotas') return Number(precios.seisCuotas?.total ?? contado);
  return contado;
}

function getSettlementUnitCost(item, modalidadPago) {
  const detalles = item?.detalles || {};
  const precios = detalles.precios || {};
  const precioBase = Number(detalles.precioBase ?? 0);
  const contado = Number(precios.contado ?? precioBase);
  if (modalidadPago === 'facturado') return Number(precios.factura?.costoBase ?? precioBase);
  if (modalidadPago === '3-cuotas') {
    return Number(precios.tresCuotas?.costoBase
      ?? (contado > 0 && precios.tresCuotas?.total != null
        ? precioBase * (Number(precios.tresCuotas.total) / contado)
        : precioBase));
  }
  if (modalidadPago === '6-cuotas') {
    return Number(precios.seisCuotas?.costoBase
      ?? (contado > 0 && precios.seisCuotas?.total != null
        ? precioBase * (Number(precios.seisCuotas.total) / contado)
        : precioBase));
  }
  return precioBase;
}

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
      porcentajeAplicado: Number,
      precios: preciosSnapshotSchema
    }
  }],
  modalidadPago: {
    type: String,
    enum: ['contado', 'facturado', '3-cuotas', '6-cuotas'],
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
  accesoPublico: {
    tokenHash: { type: String, select: false },
    emitidoAt: Date,
    venceAt: Date
  },
  aceptacionCliente: {
    aceptadaAt: Date,
    pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido' }
  },
  confirmadaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  confirmadaAt: Date,
  resumenConfirmacion: {
    totalVendido: Number,
    dineroARendir: Number,
    gananciaVendedor: Number,
    participacionHogarConectado: Number
  },
  tipoLiquidacion: { type: String, enum: ['operacion-interna', 'vendedor-50-margen'], default: 'operacion-interna' },
  venta: {
    compradorNombre: String,
    entregaAcordada: String,
    agregarEnvio: { type: Boolean, default: false },
    costoEnvio: { type: Number, default: 0, min: 0 },
    estadoPago: { type: String, enum: ['pendiente', 'parcial', 'confirmado'], default: 'pendiente' },
    estadoEntrega: { type: String, enum: ['pendiente', 'coordinada', 'entregada', 'cancelada'], default: 'pendiente' }
  },
  observaciones: String,
  creadaPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
}, { timestamps: true });

cotizacionSchema.index({ creadaPor: 1, createdAt: -1 });
cotizacionSchema.index({ estado: 1, createdAt: -1 });

cotizacionSchema.methods.calcularTotales = function() {
  this.totales.subtotal = this.productos.reduce((total, item) => {
    return total + getSelectedUnitPrice(item, this.modalidadPago) * item.cantidad;
  }, 0);
  this.totales.total = this.totales.subtotal;
  return this.totales;
};

cotizacionSchema.methods.calcularResumenConfirmacion = function() {
  const costoProductos = this.productos.reduce((total, item) => {
    return total + getSettlementUnitCost(item, this.modalidadPago) * item.cantidad;
  }, 0);
  const costoEnvio = this.venta?.agregarEnvio ? Number(this.venta.costoEnvio || 0) : 0;
  const totalProductos = this.totales.total;
  const margenComercial = Math.max(0, totalProductos - costoProductos);
  const gananciaVendedor = this.tipoLiquidacion === 'vendedor-50-margen'
    ? margenComercial / 2
    : margenComercial;
  const participacionHogarConectado = margenComercial - gananciaVendedor;
  const totalVendido = totalProductos + costoEnvio;
  const dineroARendir = totalVendido - gananciaVendedor;
  this.resumenConfirmacion = {
    totalVendido,
    dineroARendir,
    gananciaVendedor,
    participacionHogarConectado
  };
  return this.resumenConfirmacion;
};

cotizacionSchema.methods.generarMensajeWhatsApp = function() {
  const detalle = this.productos.map(item => {
    const subtotal = getSelectedUnitPrice(item, this.modalidadPago) * item.cantidad;
    const marca = item.detalles?.marca || 'Producto';
    const modelo = item.detalles?.modelo || '';
    return `• ${marca} ${modelo} x${item.cantidad}: $${subtotal.toLocaleString('es-AR')}`;
  }).join('\n');

  const modalidad = {
    contado: 'Contado',
    facturado: 'Facturado en 1 cuota',
    '3-cuotas': '3 cuotas',
    '6-cuotas': '6 cuotas'
  }[this.modalidadPago] || this.modalidadPago;
  const total = Number(this.totales?.total ?? this.calcularTotales().total ?? 0);
  const cuotas = this.modalidadPago === '3-cuotas'
    ? `\n3 cuotas de $${(total / 3).toLocaleString('es-AR')}`
    : this.modalidadPago === '6-cuotas'
      ? `\n6 cuotas de $${(total / 6).toLocaleString('es-AR')}`
      : '';

  return `🏠 *Hogar Conectado*\n\n*Cotización para ${this.datosContacto?.nombre || 'Cliente'}*\n${detalle}\n\n💰 Total: $${total.toLocaleString('es-AR')}${cuotas}\nModalidad: ${modalidad}\n\n${this.observaciones || ''}`.trim();
};

module.exports = mongoose.model('Cotizacion', cotizacionSchema);
