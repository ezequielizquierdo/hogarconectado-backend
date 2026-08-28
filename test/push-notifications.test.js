const test = require('node:test');
const assert = require('node:assert/strict');
const { getPushConfig } = require('../services/pushNotifications');

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
