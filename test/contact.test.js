const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidPhone, normalizeContactName, normalizePhone } = require('../utils/contact');

test('normaliza nombre y teléfono sin perder el prefijo internacional', () => {
  assert.equal(normalizeContactName('  Ana   Pérez  '), 'Ana Pérez');
  assert.equal(normalizePhone('+54 9 11 5555-1234'), '+5491155551234');
});

test('valida teléfonos por cantidad razonable de dígitos', () => {
  assert.equal(isValidPhone('11 5555-1234'), true);
  assert.equal(isValidPhone('123'), false);
  assert.equal(isValidPhone('1234567890123456'), false);
});
