const { normalizePhone } = require('./contact');

function quoteMatchesInquiry(consulta, contacto, productIds) {
  if (!consulta?.contacto?.telefono || !Array.isArray(productIds)) return false;
  const consultedIds = new Set((consulta.productos?.length
    ? consulta.productos.map(item => item.producto.toString())
    : [consulta.producto?.toString()].filter(Boolean)));
  return normalizePhone(consulta.contacto.telefono) === normalizePhone(contacto?.telefono)
    && productIds.some(id => consultedIds.has(id.toString()));
}

function canLinkInquiry(user, consulta) {
  if (user?.rol !== 'vendedor') return true;
  return [consulta?.vendedorOrigen, consulta?.asignadaA]
    .some(id => id?.toString() === user._id.toString());
}

function resolveSellerOrigin(user, consulta) {
  return consulta?.vendedorOrigen || (user?.rol === 'vendedor' ? user._id : undefined);
}

module.exports = { canLinkInquiry, quoteMatchesInquiry, resolveSellerOrigin };
