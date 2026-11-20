const DEFAULT_MARGIN_PERCENTAGE = 10;
const EXCLUDED_CONDITION_PATTERNS = [
  { reason: 'Producto reparado', pattern: /\breparad[oa]s?\b/i },
  { reason: 'Producto sin caja', pattern: /\bsin\s+caja\b/i },
  { reason: 'Embalaje abierto', pattern: /\bembalaje\s+abiert[oa]\b/i },
  { reason: 'Caja abierta', pattern: /\bcaja\s+abiert[oa]\b/i },
  { reason: 'Open box', pattern: /\bopen\s*box\b/i }
];

const CATEGORY_ALIASES = new Map([
  ['aire acondicionado', 'Aire acondicionado'],
  ['anafe', 'Anafes y Cocinas'],
  ['cocina', 'Anafes y Cocinas'],
  ['aspiradora', 'Aspiradoras'],
  ['auriculares', 'Audio'],
  ['barra de sonido', 'Audio'],
  ['minicomponente', 'Audio'],
  ['parlante', 'Audio'],
  ['bicibleta', 'Bicicletas'],
  ['bicicleta', 'Bicicletas'],
  ['batidora', 'Licuadoras y Batidoras'],
  ['bateria de cocina', 'Baterías de cocina'],
  ['licuadora', 'Licuadoras y Batidoras'],
  ['mixer', 'Licuadoras y Batidoras'],
  ['bordeadora', 'Jardinería'],
  ['cortadora de pasto', 'Jardinería'],
  ['robot limpiapiscinas', 'Jardinería'],
  ['sopladora', 'Jardinería'],
  ['botella termica', 'Bazar'],
  ['copa', 'Bazar'],
  ['olla', 'Bazar'],
  ['parrilla ahumadora', 'Asaderas, parrilleras y hornos de barro'],
  ['parrilla duomo asador', 'Asaderas, parrilleras y hornos de barro'],
  ['parrilla', 'Asaderas, parrilleras y hornos de barro'],
  ['pava silbadora', 'Bazar'],
  ['provoletera', 'Bazar'],
  ['sarten', 'Bazar'],
  ['set de cuchillos', 'Bazar'],
  ['set de sartenes', 'Bazar'],
  ['tabla', 'Bazar'],
  ['termo', 'Bazar'],
  ['vaso termico', 'Bazar'],
  ['cafetera', 'Cafeteras'],
  ['cafetera empotrable', 'Cafeteras'],
  ['campana', 'Campanas de cocina'],
  ['extractor', 'Campanas de cocina'],
  ['purificador de cocina', 'Campanas de cocina'],
  ['cargador', 'Celulares'],
  ['calefon', 'Calefones'],
  ['calefactor', 'Calefacción'],
  ['caldera', 'Calefacción'],
  ['caloventor', 'Calefacción'],
  ['convector', 'Calefacción'],
  ['estufa', 'Calefacción'],
  ['panel convector', 'Calefacción'],
  ['panel radiante', 'Calefacción'],
  ['cava', 'Cavas'],
  ['cava cervecera', 'Cavas'],
  ['combo horno emp + anafe', 'Anafes y Cocinas'],
  ['combo secador + planchita', 'Cuidado del cabello'],
  ['consola', 'Gaming'],
  ['mesa gamer', 'Gaming'],
  ['playstation 5', 'Gaming'],
  ['silla gamer', 'Gaming'],
  ['contadora de billetes', 'Informática'],
  ['cortadora de alimentos', 'Procesadoras de Alimentos'],
  ['impresora', 'Informática'],
  ['monitor', 'Informática'],
  ['notebook', 'Informática'],
  ['proyector', 'Informática'],
  ['teclado + mouse', 'Informática'],
  ['dispenser de agua', 'Dispenser'],
  ['espumador de leche', 'Espumador'],
  ['exprimidor', 'Exprimidores'],
  ['extractor de jugo', 'Exprimidores'],
  ['fabrica de hielo', 'Hielera'],
  ['freidora', 'Freidoras'],
  ['freezer', 'Freezers'],
  ['freezer bajo mesada', 'Freezers'],
  ['freezer exhibidor', 'Freezers'],
  ['freezer vertical', 'Freezers'],
  ['heladera', 'Heladeras'],
  ['heladera bajo mesada', 'Heladeras'],
  ['heladera exhibidora', 'Heladeras'],
  ['heladera mostrador', 'Heladeras'],
  ['combo heladera + freezer', 'Heladeras'],
  ['grupo electrogeno', 'Herramientas'],
  ['hidrolavadora', 'Herramientas'],
  ['handie', 'Audio'],
  ['horno eléctrico', 'Hornos Eléctricos'],
  ['horno empotrable', 'Hornos Eléctricos'],
  ['horno pastelero', 'Hornos Eléctricos'],
  ['horno pizzero', 'Hornos Eléctricos'],
  ['horno semi industrial', 'Hornos Eléctricos'],
  ['lavarropas', 'Lavarropas'],
  ['lavasecarropas', 'Lavarropas'],
  ['lavasecarropas torre', 'Lavarropas'],
  ['lavavajillas', 'Lavavajillas'],
  ['microondas', 'Microondas'],
  ['microondas empotrable', 'Microondas'],
  ['monopatin', 'Movilidad'],
  ['maquina de helados', 'Electrodomésticos'],
  ['fabrica de algodon de azúcar', 'Electrodomésticos'],
  ['fabrica de pan', 'Electrodomésticos'],
  ['multiolla', 'Electrodomésticos'],
  ['olla eléctrica', 'Electrodomésticos'],
  ['olla multicocina', 'Electrodomésticos'],
  ['robot de cocina', 'Electrodomésticos'],
  ['sandwichera', 'Electrodomésticos'],
  ['sopera electrica', 'Electrodomésticos'],
  ['yogurtera', 'Electrodomésticos'],
  ['masajeador', 'Cuidado personal'],
  ['multiprocesadora', 'Procesadoras de Alimentos'],
  ['picador', 'Procesadoras de Alimentos'],
  ['picadora de carne', 'Procesadoras de Alimentos'],
  ['procesadora', 'Procesadoras de Alimentos'],
  ['rallador de alimento', 'Procesadoras de Alimentos'],
  ['rallador electrico', 'Procesadoras de Alimentos'],
  ['reloj', 'Relojes'],
  ['parrilla electrica', 'Parrillas Eléctricas'],
  ['parrilla a gas', 'Asaderas, parrilleras y hornos de barro'],
  ['pava eléctrica', 'Pavas Eléctricas'],
  ['plancha', 'Planchas'],
  ['planchita para pelo', 'Cuidado del cabello'],
  ['cepillo modelador', 'Cuidado del cabello'],
  ['cepillo secador', 'Cuidado del cabello'],
  ['secador de pelo', 'Cuidado del cabello'],
  ['secarropas', 'Secarropas'],
  ['soporte', 'Informática'],
  ['tablet', 'Tablets'],
  ['televisor', 'Smart TV'],
  ['termotanque', 'Termotanques'],
  ['tostadora', 'Tostadoras'],
  ['vaporizador de ropa', 'Planchas'],
  ['ventilador', 'Ventilación']
].map(([source, target]) => [normalizeText(source), target]));

function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeText(value) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function titleCase(value) {
  return cleanText(value)
    .toLocaleLowerCase('es')
    .replace(/(^|\s)([a-záéíóúñ])/g, (_match, prefix, letter) => `${prefix}${letter.toLocaleUpperCase('es')}`);
}

function canonicalCategory(value) {
  const normalized = normalizeText(value);
  return CATEGORY_ALIASES.get(normalized) || titleCase(value);
}

function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = cleanText(value);
  if (!text) return null;

  const sanitized = text.replace(/[^0-9,.-]/g, '');
  if (!sanitized) return null;
  const lastComma = sanitized.lastIndexOf(',');
  const lastDot = sanitized.lastIndexOf('.');
  let normalized = sanitized;

  if (lastComma > lastDot) {
    normalized = sanitized.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    normalized = sanitized.replace(/,/g, '');
  } else {
    normalized = sanitized.replace(',', '.');
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parsePrice(value) {
  const amount = parseNumber(value);
  const text = cleanText(value).toLocaleLowerCase('es');
  const currency = /usd|u\$s|d[oó]lar/.test(text) ? 'USD' : 'ARS';
  return { amount, currency };
}

function parseDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function productKey(brand, model) {
  return `${normalizeText(brand)}::${normalizeText(model)}`;
}

function normalizeStock(value) {
  const informed = parseNumber(value);
  const quantity = Number.isFinite(informed) ? Math.max(0, Math.trunc(informed)) : 0;
  return {
    cantidad: quantity,
    disponible: quantity > 0,
    informado: informed
  };
}

function normalizeGeniusRow(row, rowNumber) {
  const category = canonicalCategory(row.PRODUCTO);
  const brand = cleanText(row.MARCA);
  const model = cleanText(row.MODELO);
  const price = parsePrice(row.PRECIO);
  const stock = normalizeStock(row.STOCK);
  const conditionText = `${cleanText(row.DETALLE)} ${cleanText(row.OBSERVACIONES)}`.trim();
  const conditionExclusionReasons = EXCLUDED_CONDITION_PATTERNS
    .filter(({ pattern }) => pattern.test(conditionText))
    .map(({ reason }) => reason);
  const excludedByCurrency = price.currency !== 'ARS';
  const exclusionReasons = [
    ...conditionExclusionReasons,
    ...(excludedByCurrency ? [`Moneda no admitida: ${price.currency}`] : [])
  ];
  const errors = [];

  if (!category) errors.push('Falta la categoría');
  if (!brand) errors.push('Falta la marca');
  if (!model) errors.push('Falta el modelo');
  if (!Number.isFinite(price.amount) || price.amount <= 0) errors.push('El precio no es válido');

  const key = productKey(brand, model);
  return {
    valid: errors.length === 0,
    excluded: exclusionReasons.length > 0,
    excludedByCondition: conditionExclusionReasons.length > 0,
    excludedByCurrency,
    exclusionReasons,
    errors,
    rowNumber,
    key,
    categoria: category,
    marca: brand,
    modelo: model,
    descripcion: cleanText(row.DETALLE),
    precioGenius: price.amount,
    precioBase: Number.isFinite(price.amount) ? price.amount : null,
    moneda: price.currency,
    porcentajeGanancia: DEFAULT_MARGIN_PERCENTAGE,
    propietario: 'Genius',
    especificaciones: {
      color: cleanText(row.COLOR) || undefined,
      dimensiones: cleanText(row['MEDIDAS An x AL x P']) || undefined,
      peso: cleanText(row.PESO) || undefined
    },
    stock: {
      cantidad: stock.cantidad,
      disponible: stock.disponible
    },
    sincronizacionGenius: {
      clave: key,
      filaOrigen: rowNumber,
      fechaPrecio: parseDate(row['FECHA PRECIO']),
      fechaIngreso: parseDate(row['FECHA INGRESO']),
      controlStock: parseDate(row['CONTROL STOCK']),
      stockInformado: stock.informado,
      reservadoInformado: parseNumber(row.RESERVADO),
      ingresoInformado: parseNumber(row.INGRESO),
      deposito: cleanText(row.DEPO) || undefined,
      iva: parseNumber(row.IVA),
      observaciones: cleanText(row.OBSERVACIONES) || undefined,
      presenteEnUltimaPlanilla: true
    }
  };
}

function groupByKey(items, keySelector) {
  return items.reduce((groups, item) => {
    const key = keySelector(item);
    const values = groups.get(key) || [];
    values.push(item);
    groups.set(key, values);
    return groups;
  }, new Map());
}

function isEssenProduct(product) {
  return normalizeText(product?.marca) === 'essen'
    || normalizeText(product?.catalogo?.nombre) === 'essen';
}

function existingCategoryName(product) {
  if (typeof product?.categoria === 'string') return product.categoria;
  return product?.categoria?.nombre || '';
}

function sourceSpecifications(source) {
  return Object.fromEntries(
    Object.entries(source.especificaciones || {}).filter(([, value]) => value !== undefined && value !== '')
  );
}

function buildSynchronizationMetadata(source, synchronizedAt) {
  return {
    ...source.sincronizacionGenius,
    ultimaSincronizacion: synchronizedAt,
    presenteEnUltimaPlanilla: true,
    noEncontradoDesde: null
  };
}

function hasAvailableStock(stock) {
  return Boolean(stock?.disponible) && Number(stock?.cantidad) > 0;
}

function buildNewArrivalMarker(source, current, synchronizedAt) {
  if (!hasAvailableStock(source?.stock)) return { activo: false };

  if (!current) {
    return { activo: true, tipo: 'alta', detectadoEn: synchronizedAt };
  }

  if (!hasAvailableStock(current.stock)) {
    return { activo: true, tipo: 'reposicion', detectadoEn: synchronizedAt };
  }

  return { activo: false };
}

function buildGeniusCreateDocument(source, categoryId, synchronizedAt) {
  return {
    categoria: categoryId,
    marca: source.marca,
    modelo: source.modelo,
    precioBase: source.precioBase,
    precioGenius: source.precioGenius,
    moneda: 'ARS',
    propietario: 'Genius',
    porcentajeGanancia: DEFAULT_MARGIN_PERCENTAGE,
    tipoComercializacion: 'stock-propio',
    descripcion: source.descripcion || undefined,
    especificaciones: sourceSpecifications(source),
    stock: source.stock,
    nuevoIngreso: buildNewArrivalMarker(source, null, synchronizedAt),
    sincronizacionGenius: buildSynchronizationMetadata(source, synchronizedAt),
    imagenes: [],
    imagenPublicIds: [],
    activo: true,
    tags: []
  };
}

function buildGeniusUpdateSet(source, categoryId, synchronizedAt, current) {
  const update = {
    categoria: categoryId,
    marca: source.marca,
    modelo: source.modelo,
    precioBase: source.precioBase,
    precioGenius: source.precioGenius,
    moneda: 'ARS',
    propietario: 'Genius',
    stock: source.stock,
    nuevoIngreso: buildNewArrivalMarker(source, current, synchronizedAt),
    sincronizacionGenius: buildSynchronizationMetadata(source, synchronizedAt),
    activo: true
  };

  if (source.descripcion) update.descripcion = source.descripcion;
  for (const [key, value] of Object.entries(sourceSpecifications(source))) {
    update[`especificaciones.${key}`] = value;
  }
  return update;
}

function buildMissingProductUpdate(product, synchronizedAt) {
  return {
    'sincronizacionGenius.presenteEnUltimaPlanilla': false,
    'sincronizacionGenius.ultimaSincronizacion': synchronizedAt,
    'sincronizacionGenius.noEncontradoDesde': product.sincronizacionGenius?.noEncontradoDesde || synchronizedAt
  };
}

function buildGeniusSyncPlan(rows, existingProducts = [], existingCategories = []) {
  const populatedRows = rows
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(({ row }) => Object.values(row).some(value => cleanText(value)));
  const normalizedRows = populatedRows.map(({ row, rowNumber }) => normalizeGeniusRow(row, rowNumber));
  const excludedRows = normalizedRows.filter(row => row.excluded);
  const validRows = normalizedRows.filter(row => row.valid && !row.excluded);
  const invalidRows = normalizedRows.filter(row => !row.valid && !row.excluded);
  const eligibleExisting = existingProducts.filter(product => !isEssenProduct(product));
  const sourceGroups = groupByKey(validRows, row => row.key);
  const existingGroups = groupByKey(eligibleExisting, product => productKey(product.marca, product.modelo));
  const creates = [];
  const updates = [];
  const conflicts = [];

  for (const [key, sourceMatches] of sourceGroups) {
    const databaseMatches = existingGroups.get(key) || [];
    if (sourceMatches.length === 1 && databaseMatches.length === 0) {
      creates.push(sourceMatches[0]);
      continue;
    }
    if (sourceMatches.length === 1 && databaseMatches.length === 1) {
      updates.push({ source: sourceMatches[0], current: databaseMatches[0] });
      continue;
    }
    conflicts.push({
      key,
      reason: sourceMatches.length > 1
        ? 'Marca y modelo repetidos en la planilla'
        : 'Marca y modelo coinciden con más de un producto existente',
      source: sourceMatches,
      current: databaseMatches
    });
  }

  const sourceKeys = new Set(
    normalizedRows
      .filter(row => row.marca && row.modelo)
      .map(row => row.key)
  );
  const missingFromSpreadsheet = eligibleExisting.filter(product => (
    !sourceKeys.has(productKey(product.marca, product.modelo))
  ));
  const categoryNames = new Map(existingCategories.map(category => [normalizeText(category.nombre), category.nombre]));
  const categoriesToCreate = [...new Set(validRows.map(row => row.categoria))]
    .filter(name => !categoryNames.has(normalizeText(name)))
    .sort((left, right) => left.localeCompare(right, 'es'));
  const availableCreates = creates.filter(source => hasAvailableStock(source.stock));
  const restockedProducts = updates.filter(({ source, current }) => (
    hasAvailableStock(source.stock) && !hasAvailableStock(current.stock)
  ));

  return {
    generatedAt: new Date(),
    rules: {
      sourceSheet: 'NEW QUEBRA',
      baseSurchargePercentage: 0,
      defaultMarginPercentage: DEFAULT_MARGIN_PERCENTAGE,
      absentProducts: 'mark-for-review',
      essenProducts: 'excluded',
      specialConditionProducts: 'excluded',
      foreignCurrencies: 'excluded'
    },
    summary: {
      populatedRows: populatedRows.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      excludedByCondition: excludedRows.filter(row => row.excludedByCondition).length,
      excludedByCurrency: excludedRows.filter(row => row.excludedByCurrency).length,
      creates: creates.length,
      updates: updates.length,
      conflicts: conflicts.length,
      categoriesToCreate: categoriesToCreate.length,
      missingFromSpreadsheet: missingFromSpreadsheet.length,
      essenExcluded: existingProducts.length - eligibleExisting.length,
      newAvailableProducts: availableCreates.length,
      restockedProducts: restockedProducts.length,
      newArrivalMarkers: availableCreates.length + restockedProducts.length
    },
    creates,
    updates,
    conflicts,
    excludedRows,
    invalidRows,
    categoriesToCreate,
    missingFromSpreadsheet
  };
}

module.exports = {
  CATEGORY_ALIASES,
  DEFAULT_MARGIN_PERCENTAGE,
  EXCLUDED_CONDITION_PATTERNS,
  buildGeniusCreateDocument,
  buildGeniusUpdateSet,
  buildNewArrivalMarker,
  buildMissingProductUpdate,
  buildGeniusSyncPlan,
  canonicalCategory,
  cleanText,
  isEssenProduct,
  normalizeGeniusRow,
  normalizeStock,
  normalizeText,
  parseNumber,
  parsePrice,
  productKey
};
