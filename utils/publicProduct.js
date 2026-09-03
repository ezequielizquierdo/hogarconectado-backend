function serializePublicProduct(product) {
  const source = typeof product?.toObject === 'function'
    ? product.toObject({ virtuals: true })
    : product;

  return {
    _id: source._id,
    categoria: source.categoria,
    marca: source.marca,
    modelo: source.modelo,
    descripcion: source.descripcion,
    imagenes: source.imagenes || [],
    stock: source.stock,
    precioConGanancia: source.precioConGanancia
  };
}

function serializeAuthenticatedProduct(product) {
  const source = typeof product?.toObject === 'function'
    ? product.toObject({ virtuals: true })
    : product;
  const prices = typeof product?.calcularCuotas === 'function'
    ? product.calcularCuotas()
    : source.precios;

  return { ...source, precios: prices };
}

function serializeSellerProduct(product) {
  const source = serializePublicProduct(product);
  const prices = typeof product?.calcularCuotas === 'function'
    ? product.calcularCuotas()
    : product?.precios;
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

module.exports = { serializeAuthenticatedProduct, serializePublicProduct, serializeSellerProduct };
