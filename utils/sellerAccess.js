function buildSellerInquiryFilter(userId) {
  return {
    $or: [
      { asignadaA: userId },
      { vendedorOrigen: userId },
      { asignadaA: null, vendedorOrigen: null }
    ]
  };
}

function buildQuoteOwnershipFilter(user) {
  return user?.rol === 'vendedor'
    ? { $or: [{ creadaPor: user._id }, { vendedorOrigen: user._id }] }
    : {};
}

module.exports = { buildQuoteOwnershipFilter, buildSellerInquiryFilter };
