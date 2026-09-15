const CATALOG_AVAILABILITY_STATES = ['pendiente', 'disponible', 'no-disponible', 'encargado', 'recibido'];

const TRANSITIONS = {
  pendiente: ['disponible', 'no-disponible'],
  disponible: ['pendiente', 'no-disponible', 'encargado'],
  'no-disponible': ['pendiente', 'disponible'],
  encargado: ['disponible', 'recibido'],
  recibido: ['encargado']
};

function canTransitionCatalogAvailability(current = 'pendiente', next) {
  return current === next || Boolean(TRANSITIONS[current]?.includes(next));
}

module.exports = { CATALOG_AVAILABILITY_STATES, canTransitionCatalogAvailability };
