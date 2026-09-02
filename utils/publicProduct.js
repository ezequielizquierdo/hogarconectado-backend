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

module.exports = { serializeAuthenticatedProduct, serializePublicProduct };
