const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

const PRODUCT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    marca: { type: 'STRING', nullable: true },
    modelo: { type: 'STRING', nullable: true },
    categoriaSugerida: { type: 'STRING', nullable: true },
    descripcion: { type: 'STRING', nullable: true },
    precioBase: { type: 'NUMBER', nullable: true },
    stockCantidad: { type: 'INTEGER', nullable: true },
    stockDisponible: { type: 'BOOLEAN', nullable: true },
    confianza: { type: 'NUMBER', minimum: 0, maximum: 1 },
    advertencias: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['marca', 'modelo', 'categoriaSugerida', 'descripcion', 'precioBase', 'stockCantidad', 'stockDisponible', 'confianza', 'advertencias']
};

function parseImageData(imageData) {
  const match = typeof imageData === 'string' && imageData.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw Object.assign(new Error('Formato de imagen inválido'), { statusCode: 400 });
  const bytes = Buffer.byteLength(match[2], 'base64');
  if (bytes > 8 * 1024 * 1024) throw Object.assign(new Error('La imagen supera el máximo de 8 MB'), { statusCode: 413 });
  return { mimeType: match[1] === 'image/jpg' ? 'image/jpeg' : match[1], data: match[2] };
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function sanitizeDraft(raw, categoryNames) {
  const normalizedCategories = new Map(categoryNames.map(name => [name.toLocaleLowerCase('es'), name]));
  const proposedCategory = cleanText(raw?.categoriaSugerida, 100);
  const matchedCategory = normalizedCategories.get(proposedCategory.toLocaleLowerCase('es')) || proposedCategory;
  const price = Number(raw?.precioBase);
  const stock = Number(raw?.stockCantidad);
  const confidence = Number(raw?.confianza);
  const warnings = Array.isArray(raw?.advertencias)
    ? raw.advertencias.map(item => cleanText(item, 180)).filter(Boolean).slice(0, 8)
    : [];

  if (proposedCategory && !normalizedCategories.has(proposedCategory.toLocaleLowerCase('es'))) {
    warnings.push(`La categoría sugerida \"${proposedCategory}\" no existe todavía.`);
  }

  return {
    marca: cleanText(raw?.marca, 100),
    modelo: cleanText(raw?.modelo, 100),
    categoriaSugerida: matchedCategory,
    descripcion: cleanText(raw?.descripcion, 500),
    precioBase: Number.isFinite(price) && price > 0 ? price : null,
    stockCantidad: Number.isInteger(stock) && stock >= 0 ? stock : 0,
    stockDisponible: typeof raw?.stockDisponible === 'boolean' ? raw.stockDisponible : stock > 0,
    confianza: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0,
    advertencias: [...new Set(warnings)]
  };
}

async function analyzeProductImage({ imageData, categoryNames = [], fetchImpl = fetch }) {
  if (!process.env.GEMINI_API_KEY) {
    throw Object.assign(new Error('El análisis inteligente de imágenes no está configurado'), { statusCode: 503 });
  }

  const image = parseImageData(imageData);
  const categories = categoryNames.length ? categoryNames.join(', ') : 'sin categorías cargadas';
  const prompt = `Analizá esta imagen comercial de un único producto y prepará un borrador para un catálogo argentino.
Extraé solamente datos visibles o claramente inferibles. No inventes.
Categorías existentes: ${categories}.
Usá exactamente una categoría existente cuando corresponda; si ninguna sirve, proponé un nombre breve nuevo.
precioBase debe ser el precio de lista/contado total del producto, nunca el valor de una cuota. Quitá símbolos y separadores de miles.
stockCantidad y stockDisponible solo deben reflejar datos explícitos; si no aparecen, usá 0 y false y agregá una advertencia.
La descripción debe ser breve, comercial y basada en prestaciones visibles.
Agregá advertencias para todo dato ambiguo o ausente. Respondé únicamente con el JSON solicitado.`;

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.data } }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: PRODUCT_SCHEMA, temperature: 0.1 }
    })
  });

  if (!response.ok) {
    throw Object.assign(new Error('No pudimos analizar la imagen en este momento'), { statusCode: response.status === 429 ? 429 : 502 });
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
  if (!text) throw Object.assign(new Error('No pudimos reconocer información del producto'), { statusCode: 422 });

  try {
    return sanitizeDraft(JSON.parse(text), categoryNames);
  } catch {
    throw Object.assign(new Error('La respuesta del análisis no tuvo un formato válido'), { statusCode: 502 });
  }
}

module.exports = { analyzeProductImage, parseImageData, sanitizeDraft };
