const test = require('node:test');
const assert = require('node:assert/strict');
const { buildInquiryNotificationPayload, getPushConfig } = require('../services/pushNotifications');

test('Web Push queda deshabilitado si falta una variable VAPID', () => {
  const previous = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT
  };

  process.env.VAPID_PUBLIC_KEY = 'public-test';
  delete process.env.VAPID_PRIVATE_KEY;
  process.env.VAPID_SUBJECT = 'mailto:test@example.com';
  assert.equal(getPushConfig(), null);

  if (previous.publicKey === undefined) delete process.env.VAPID_PUBLIC_KEY;
  else process.env.VAPID_PUBLIC_KEY = previous.publicKey;
  if (previous.privateKey === undefined) delete process.env.VAPID_PRIVATE_KEY;
  else process.env.VAPID_PRIVATE_KEY = previous.privateKey;
  if (previous.subject === undefined) delete process.env.VAPID_SUBJECT;
  else process.env.VAPID_SUBJECT = previous.subject;
});

test('Web Push expone únicamente la configuración completa', () => {
  const previous = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT
  };

  process.env.VAPID_PUBLIC_KEY = 'public-test';
  process.env.VAPID_PRIVATE_KEY = 'private-test';
  process.env.VAPID_SUBJECT = 'mailto:test@example.com';
  assert.deepEqual(getPushConfig(), {
    publicKey: 'public-test',
    privateKey: 'private-test',
    subject: 'mailto:test@example.com'
  });

  if (previous.publicKey === undefined) delete process.env.VAPID_PUBLIC_KEY;
  else process.env.VAPID_PUBLIC_KEY = previous.publicKey;
  if (previous.privateKey === undefined) delete process.env.VAPID_PRIVATE_KEY;
  else process.env.VAPID_PRIVATE_KEY = previous.privateKey;
  if (previous.subject === undefined) delete process.env.VAPID_SUBJECT;
  else process.env.VAPID_SUBJECT = previous.subject;
});

test('Web Push normaliza espacios accidentales en variables VAPID', () => {
  const previous = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT
  };

  process.env.VAPID_PUBLIC_KEY = '  public-test  ';
  process.env.VAPID_PRIVATE_KEY = '  private-test\n';
  process.env.VAPID_SUBJECT = ' mailto:test@example.com ';
  assert.deepEqual(getPushConfig(), {
    publicKey: 'public-test',
    privateKey: 'private-test',
    subject: 'mailto:test@example.com'
  });

  if (previous.publicKey === undefined) delete process.env.VAPID_PUBLIC_KEY;
  else process.env.VAPID_PUBLIC_KEY = previous.publicKey;
  if (previous.privateKey === undefined) delete process.env.VAPID_PRIVATE_KEY;
  else process.env.VAPID_PRIVATE_KEY = previous.privateKey;
  if (previous.subject === undefined) delete process.env.VAPID_SUBJECT;
  else process.env.VAPID_SUBJECT = previous.subject;
});

test('la notificación de consulta no expone datos personales del contacto', () => {
  const payload = buildInquiryNotificationPayload({
    _id: { toString: () => 'consulta-test' },
    productoSnapshot: { marca: 'TCL', modelo: '435SK' },
    contacto: { nombre: 'Nombre privado', telefono: '+5491112345678' }
  });

  assert.equal(payload.title, 'Tenés una consulta por responder');
  assert.equal(payload.body, 'TCL 435SK · Nueva consulta');
  assert.equal(payload.body.includes('Nombre privado'), false);
  assert.equal(JSON.stringify(payload).includes('+5491112345678'), false);
});

test('la notificación resume una consulta con varios productos', () => {
  const payload = buildInquiryNotificationPayload({
    _id: { toString: () => 'consulta-multiple' },
    productoSnapshot: { marca: 'TCL', modelo: '435SK' },
    productos: [
      { productoSnapshot: { marca: 'TCL', modelo: '435SK' } },
      { productoSnapshot: { marca: 'LG', modelo: 'GS66SP' } },
      { productoSnapshot: { marca: 'Oster', modelo: 'X1' } }
    ]
  });

  assert.equal(payload.body, 'TCL 435SK y 2 más · Nueva consulta');
});
