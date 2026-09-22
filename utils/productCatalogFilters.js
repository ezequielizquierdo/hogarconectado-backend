const PERIOD_DAYS = Object.freeze({ dia: 1, semana: 7, mes: 30 });
const PRICE_ORDERS = new Set(['precio-asc', 'precio-desc']);

function updatedSince(period, now = new Date()) {
  const days = PERIOD_DAYS[period];
  return days ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000) : null;
}

function isPriceOrder(order) {
  return PRICE_ORDERS.has(order);
}

function sortBySalePrice(products, order) {
  const direction = order === 'precio-desc' ? -1 : 1;
  return products.map(product => ({ product, price: product.precioConGanancia }))
    .sort((first, second) => {
      const difference = (first.price - second.price) * direction;
      if (difference) return difference;
      const dateDifference = new Date(second.product.createdAt) - new Date(first.product.createdAt);
      return dateDifference || String(first.product._id).localeCompare(String(second.product._id));
    }).map(({ product }) => product);
}

module.exports = { updatedSince, isPriceOrder, sortBySalePrice };
