const PERIOD_DAYS = Object.freeze({ dia: 1, semana: 7, mes: 30 });
const PRICE_ORDERS = new Set(['precio-asc', 'precio-desc']);
const { calculateProductPrices } = require('./pricing');
const IMAGE_FILTERS = Object.freeze({
  'con-imagen': { 'imagenes.0': { $exists: true } },
  'sin-imagen': { 'imagenes.0': { $exists: false } }
});

function updatedSince(period, now = new Date()) {
  const days = PERIOD_DAYS[period];
  return days ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000) : null;
}

function isPriceOrder(order) {
  return PRICE_ORDERS.has(order);
}

function imagePresenceFilter(value) {
  return IMAGE_FILTERS[value] || {};
}

function stockAvailabilityFilter(value) {
  if (String(value) === 'true') {
    return {
      'stock.disponible': true,
      'stock.cantidad': { $gt: 0 }
    };
  }

  if (String(value) === 'false') {
    return {
      $or: [
        { 'stock.disponible': { $ne: true } },
        { 'stock.cantidad': { $lte: 0 } },
        { 'stock.cantidad': { $exists: false } }
      ]
    };
  }

  return null;
}

function newArrivalFilter(value) {
  return String(value) === 'true'
    ? { 'nuevoIngreso.activo': true }
    : null;
}

function sortBySalePrice(products, order) {
  const direction = order === 'precio-desc' ? -1 : 1;
  return products.map(product => {
    let price;
    try {
      price = Number(calculateProductPrices(product)?.contado);
    } catch {
      price = NaN;
    }
    return { product, price: Number.isFinite(price) ? price : null };
  })
    .sort((first, second) => {
      if (first.price === null && second.price !== null) return 1;
      if (first.price !== null && second.price === null) return -1;
      if (first.price === null && second.price === null) return fallbackProductOrder(first.product, second.product);
      const difference = (first.price - second.price) * direction;
      if (difference) return difference;
      return fallbackProductOrder(first.product, second.product);
    }).map(({ product }) => product);
}

function fallbackProductOrder(first, second) {
  const firstDate = new Date(first.createdAt).getTime();
  const secondDate = new Date(second.createdAt).getTime();
  const dateDifference = (Number.isFinite(secondDate) ? secondDate : 0)
    - (Number.isFinite(firstDate) ? firstDate : 0);
  return dateDifference || String(first._id).localeCompare(String(second._id));
}

module.exports = {
  updatedSince,
  isPriceOrder,
  imagePresenceFilter,
  newArrivalFilter,
  stockAvailabilityFilter,
  sortBySalePrice
};
