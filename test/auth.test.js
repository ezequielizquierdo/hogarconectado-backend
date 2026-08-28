const test = require('node:test');
const assert = require('node:assert/strict');
const { canAccessOwnedResource, optionalAuthenticate, requireRoles } = require('../middleware/auth');

test('admin y editor acceden a recursos de otros usuarios', () => {
  assert.equal(canAccessOwnedResource('owner', { _id: 'other', rol: 'admin' }), true);
  assert.equal(canAccessOwnedResource('owner', { _id: 'other', rol: 'editor' }), true);
});

test('consulta accede únicamente a sus propios recursos', () => {
  assert.equal(canAccessOwnedResource('owner', { _id: 'owner', rol: 'consulta' }), true);
  assert.equal(canAccessOwnedResource('owner', { _id: 'other', rol: 'consulta' }), false);
});

test('requireRoles permite y rechaza roles correctamente', () => {
  let nextCalled = false;
  requireRoles('admin')({ user: { rol: 'admin' } }, {}, () => { nextCalled = true; });
  assert.equal(nextCalled, true);

  const response = {
    statusCode: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
  requireRoles('admin')({ user: { rol: 'consulta' } }, response, () => {});
  assert.equal(response.statusCode, 403);
});

test('optionalAuthenticate permite continuar cuando no se envía una sesión', async () => {
  let nextCalled = false;
  const request = { get: () => undefined };

  await optionalAuthenticate(request, {}, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(request.user, undefined);
});
