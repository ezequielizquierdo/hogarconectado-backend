function normalizeContactName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizePhone(value) {
  const raw = String(value || '').trim();
  const hasInternationalPrefix = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  return `${hasInternationalPrefix ? '+' : ''}${digits}`;
}

function isValidPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

module.exports = { normalizeContactName, normalizePhone, isValidPhone };
