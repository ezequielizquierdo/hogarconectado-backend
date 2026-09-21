function serializeQuoteForUser(quote, user) {
  const source = typeof quote.toObject === 'function'
    ? quote.toObject({ virtuals: false })
    : { ...quote };

  const includesCatalogProduct = source.productos?.some(
    item => item.detalles?.tipoComercializacion === 'venta-catalogo'
  );
  if (includesCatalogProduct) {
    source.disponibilidadCatalogo = {
      ...(source.disponibilidadCatalogo || {}),
      requerida: true,
      estado: source.disponibilidadCatalogo?.estado || 'pendiente'
    };
  }

  if (user.rol !== 'vendedor') return source;

  delete source.tipoLiquidacion;
  if (source.resumenConfirmacion) {
    source.resumenConfirmacion = {
      totalVendido: source.resumenConfirmacion.totalVendido,
      dineroARendir: source.resumenConfirmacion.dineroARendir,
      gananciaVendedor: source.resumenConfirmacion.gananciaVendedor
    };
  }

  source.productos = source.productos.map(item => {
    const prices = item.detalles?.precios || {};
    return {
      ...item,
      detalles: {
        categoria: item.detalles?.categoria,
        marca: item.detalles?.marca,
        modelo: item.detalles?.modelo,
        tipoComercializacion: item.detalles?.tipoComercializacion || 'stock-propio',
        catalogo: item.detalles?.tipoComercializacion === 'venta-catalogo'
          ? item.detalles?.catalogo
          : undefined,
        precios: {
          contado: prices.contado,
          factura: { unPago: prices.factura?.unPago },
          tresCuotas: { total: prices.tresCuotas?.total, cuota: prices.tresCuotas?.cuota },
          seisCuotas: { total: prices.seisCuotas?.total, cuota: prices.seisCuotas?.cuota }
        }
      }
    };
  });
  return source;
}

module.exports = { serializeQuoteForUser };
