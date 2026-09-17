const TIPOS_SOLICITUD = ['productos', 'vendedor', 'ambos'];
const ESTADOS_SOLICITUD = ['nueva', 'contactada', 'aprobada', 'rechazada'];
const CANALES_VENTA = ['whatsapp', 'instagram', 'facebook', 'presencial', 'otro'];

const cleanText = (value, maxLength = 500) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);

function buildOnboardingRequest(body) {
  const tipo = TIPOS_SOLICITUD.includes(body.tipo) ? body.tipo : null;
  const canales = [...new Set((Array.isArray(body.canales) ? body.canales : []).filter(canal => CANALES_VENTA.includes(canal)))];
  const cantidad = Number.parseInt(body.cantidadAproximada, 10);
  return {
    tipo,
    contacto: {
      nombre: cleanText(body.nombre, 100),
      telefono: cleanText(body.telefono, 30),
      email: cleanText(body.email, 160).toLowerCase(),
      localidad: cleanText(body.localidad, 120),
    },
    productos: {
      descripcion: cleanText(body.productosDescripcion, 1200),
      cantidadAproximada: Number.isFinite(cantidad) && cantidad > 0 ? Math.min(cantidad, 10000) : undefined,
    },
    vendedor: {
      canales,
      experiencia: cleanText(body.experiencia, 800),
    },
    mensaje: cleanText(body.mensaje, 1200),
  };
}

module.exports = { TIPOS_SOLICITUD, ESTADOS_SOLICITUD, CANALES_VENTA, buildOnboardingRequest };
