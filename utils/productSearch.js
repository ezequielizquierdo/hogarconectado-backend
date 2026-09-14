const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const tokenizeProductSearch = (value) => String(value || '')
  .trim()
  .slice(0, 120)
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 8);

const buildProductSearchFilter = (value) => {
  const tokens = tokenizeProductSearch(value);
  if (tokens.length === 0) return null;

  return {
    $and: tokens.map((token) => {
      const expression = new RegExp(escapeRegex(token), 'i');
      return {
        $or: [
          { marca: expression },
          { modelo: expression },
          { descripcion: expression },
          { tags: expression }
        ]
      };
    })
  };
};

module.exports = {
  buildProductSearchFilter,
  tokenizeProductSearch
};
