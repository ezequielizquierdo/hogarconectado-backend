const test = require('node:test');
const assert = require('node:assert/strict');

const { CONSULTA_ESTADOS, buildConsultaStateUpdate } = require('../utils/consultaState');

test('define los estados operativos de una consulta comercial', () => {
  assert.deepEqual(CONSULTA_ESTADOS, ['nueva', 'en-gestion', 'contactada', 'cerrada']);
});

test('asigna responsable y fecha al marcar una consulta como contactada', () => {
  const now = new Date('2026-08-28T12:00:00.000Z');
  const result = buildConsultaStateUpdate({
    estado: 'contactada',
    consulta: {},
    usuarioId: 'admin-id',
    now
  });

  assert.equal(result.asignadaA, 'admin-id');
  assert.equal(result.atendidaAt, now);
  assert.equal(result.cerradaAt, undefined);
});

test('volver una consulta a nueva libera responsable y fechas de seguimiento', () => {
  const result = buildConsultaStateUpdate({
    estado: 'nueva',
    consulta: { atendidaAt: new Date(), cerradaAt: new Date() },
    usuarioId: 'admin-id'
  });

  assert.equal(result.asignadaA, null);
  assert.equal(result.atendidaAt, null);
  assert.equal(result.cerradaAt, null);
});
