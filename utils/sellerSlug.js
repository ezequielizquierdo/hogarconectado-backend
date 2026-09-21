function normalizePart(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function sellerSlugCandidates(name) {
  const parts = normalizePart(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return [];
  if (parts.length === 1) {
    const root = parts[0].slice(0, 32);
    return [root, ...Array.from({ length: 998 }, (_, index) => `${root.slice(0, 32 - String(index + 2).length)}${index + 2}`)];
  }
  const givenName = parts[0];
  const surname = parts.slice(1).join('');
  const prefixes = Array.from({ length: givenName.length }, (_, index) => givenName.slice(0, index + 1));
  const roots = prefixes.map(prefix => `${prefix}${surname}`.slice(0, 32));
  const fallback = roots[0];
  for (let suffix = 2; suffix <= 999; suffix += 1) {
    const suffixText = String(suffix);
    roots.push(`${fallback.slice(0, 32 - suffixText.length)}${suffixText}`);
  }
  return [...new Set(roots)];
}

async function findAvailableSellerSlug(name, isTaken) {
  for (const candidate of sellerSlugCandidates(name)) {
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error('No hay un enlace de vendedor disponible para este nombre');
}

module.exports = { normalizePart, sellerSlugCandidates, findAvailableSellerSlug };
