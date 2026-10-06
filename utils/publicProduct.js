const {
  calculateMarginDistribution,
  calculatePrices,
  getProductPricingConfig
} = require('./pricing');

function resolveProductPrices(product, source) {
  if (typeof product?.calcularCuotas === 'function') return product.calcularCuotas();
  if (source?.precios) return source.precios;

  const basePrice = Number(source?.precioBase);
  if (!Number.isFinite(basePrice) || basePrice < 0) return undefined;

  const now = new Date();
  const discountIsActive = Boolean(source.descuento?.activo)
    && (!source.descuento.desde || new Date(source.descuento.desde) <= now)
    && (!source.descuento.hasta || new Date(source.descuento.hasta) >= now);

  return calculatePrices(basePrice, {
    ...getProductPricingConfig(source.porcentajeGanancia, process.env),
    descuentoPorcentaje: discountIsActive ? Number(source.descuento?.porcentaje || 0) : 0
  });
}

function getSellerCommission(product, prices) {
  const source = typeof product?.toObject === 'function'
    ? product.toObject({ virtuals: true })
    : product;
  const basePrice = Number(source?.precioBase);
  const salePrice = Number(prices?.contado);
  if (!Number.isFinite(basePrice) || !Number.isFinite(salePrice)) return undefined;
  return calculateMarginDistribution(salePrice, basePrice).sellerCommission;
}

function serializePublicProduct(product) {
  const source = typeof product?.toObject === 'function'
    ? product.toObject({ virtuals: true })
    : product;

  const tipoComercializacion = source.tipoComercializacion || 'stock-propio';
  const catalogo = tipoComercializacion === 'venta-catalogo'
    ? {
        nombre: source.catalogo?.nombre,
        campania: source.catalogo?.campania,
        vigenciaHasta: source.catalogo?.vigenciaHasta,
        plazoEntrega: source.catalogo?.plazoEntrega
      }
    : undefined;
  const prices = resolveProductPrices(product, source);
  const descuentoActivo = Number(prices?.descuentoPorcentaje || 0) > 0;

  return {
    _id: source._id,
    categoria: source.categoria,
    marca: source.marca,
    modelo: source.modelo,
    descripcion: source.descripcion,
    imagenes: source.imagenes || [],
    stock: source.stock,
    precioConGanancia: prices?.contado ?? source.precioConGanancia,
    descuento: descuentoActivo ? {
      activo: true,
      porcentaje: prices.descuentoPorcentaje,
      precioAnterior: prices.contadoSinDescuento,
      precioPromocional: prices.contado
    } : undefined,
    tipoComercializacion,
    catalogo,
    disponiblePorPedido: tipoComercializacion === 'venta-catalogo'
  };
}

function serializeAuthenticatedProduct(product) {
  const source = typeof product?.toObject === 'function'
    ? product.toObject({ virtuals: true })
    : product;
  const prices = resolveProductPrices(product, source);

  return {
    ...source,
    precios: prices
  };
}

function serializeAdminProduct(product) {
  const serialized = serializeAuthenticatedProduct(product);
  return {
    ...serialized,
    comisionVendedor: getSellerCommission(product, serialized.precios)
  };
}

function serializeSellerProduct(product) {
  const source = serializePublicProduct(product);
  const prices = resolveProductPrices(product, product);
  if (!prices) return source;
  return {
    ...source,
    precios: {
      contado: prices.contado,
      factura: { unPago: prices.factura?.unPago },
      tresCuotas: { total: prices.tresCuotas?.total, cuota: prices.tresCuotas?.cuota },
      seisCuotas: { total: prices.seisCuotas?.total, cuota: prices.seisCuotas?.cuota }
    }
  };
}

module.exports = {
  serializeAdminProduct,
  serializeAuthenticatedProduct,
  serializePublicProduct,
  serializeSellerProduct
};
