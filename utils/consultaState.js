const CONSULTA_ESTADOS = ['nueva', 'en-gestion', 'contactada', 'cerrada'];

function buildConsultaStateUpdate({ estado, consulta, usuarioId, now = new Date() }) {
  return {
    estado,
    asignadaA: estado === 'nueva' ? null : usuarioId,
    atendidaAt: estado === 'contactada' ? now : (estado === 'nueva' ? null : consulta.atendidaAt),
    cerradaAt: estado === 'cerrada' ? now : (estado === 'nueva' ? null : consulta.cerradaAt)
  };
}

module.exports = { CONSULTA_ESTADOS, buildConsultaStateUpdate };
