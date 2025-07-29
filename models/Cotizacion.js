const mongoose = require('mongoose');

const cotizacionSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: [true, 'El producto es requerido']
  },
  datosProducto: {
    // Snapshot de los datos del producto al momento de la cotización
    categoria: String,
    marca: String,
    modelo: String,
    descripcion: String,
    precioBase: Number
  },
  precios: {
    contado: { type: Number, required: true },
    tresCuotas: {
      total: Number,
      cuota: Number
    },
    seisCuotas: {
      total: Number,
      cuota: Number
    }
  },
  factoresUsados: {
    ganancia: { type: Number, default: 0.30 },
    factor3Cuotas: { type: Number, default: 1.1298 },
    factor6Cuotas: { type: Number, default: 1.2138 }
  },
  cliente: {
    nombre: String,
    telefono: String,
    email: String,
    notas: String
  },
  estado: {
    type: String,
    enum: ['borrador', 'enviado', 'aceptado', 'rechazado', 'vencido'],
    default: 'borrador'
  },
  validaHasta: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días desde creación
  },
  notas: String,
  mensajeGenerado: String // El mensaje formateado para WhatsApp/Instagram
}, {
  timestamps: true
});

// Índices
cotizacionSchema.index({ producto: 1 });
cotizacionSchema.index({ estado: 1 });
cotizacionSchema.index({ validaHasta: 1 });
cotizacionSchema.index({ createdAt: -1 });

// Método para verificar si la cotización está vigente
cotizacionSchema.methods.estaVigente = function() {
  return new Date() <= this.validaHasta;
};

// Método para generar mensaje formateado
cotizacionSchema.methods.generarMensaje = function() {
  const mensaje = `🏠 *Hogar Conectado*

*Cotización*
📦 ${this.datosProducto.categoria?.toUpperCase() || 'N/A'}
🏷️ ${this.datosProducto.marca?.toUpperCase()} - ${this.datosProducto.modelo?.toUpperCase()}
${this.datosProducto.descripcion ? `✏️ ${this.datosProducto.descripcion.toUpperCase()}` : ''}

💰 *Precios:*
💵 Contado: $${this.precios.contado.toLocaleString('es-AR')}
💳 3 Cuotas: $${this.precios.tresCuotas.total.toLocaleString('es-AR')} (${this.precios.tresCuotas.cuota.toLocaleString('es-AR')} c/u)
💳 6 Cuotas: $${this.precios.seisCuotas.total.toLocaleString('es-AR')} (${this.precios.seisCuotas.cuota.toLocaleString('es-AR')} c/u)

📞 *Contacto*
WhatsApp: +54 9 11 XXXX-XXXX
📧 Email: contacto@hogarconectado.com

✨ *Cotización válida hasta:* ${this.validaHasta.toLocaleDateString('es-AR')}

¡Gracias por elegirnos! 🌟`;

  return mensaje;
};

module.exports = mongoose.model('Cotizacion', cotizacionSchema);
