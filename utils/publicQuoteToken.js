const crypto = require('crypto');

function createPublicQuoteToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashPublicQuoteToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function isValidPublicQuoteToken(token) {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{40,64}$/.test(token);
}

module.exports = { createPublicQuoteToken, hashPublicQuoteToken, isValidPublicQuoteToken };
