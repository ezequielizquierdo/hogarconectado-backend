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
  return user?.rol === 'vendedor' ? { creadaPor: user._id } : {};
}

module.exports = { buildQuoteOwnershipFilter, buildSellerInquiryFilter };
