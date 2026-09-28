const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const RATE_LIMIT_COOLDOWN_MS = 60_000;
const UNAVAILABLE_COOLDOWN_MS = 30_000;
let analysisUnavailableUntil = 0;

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

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function getRetryDelay(response, attempt) {
  const retryAfter = Number(response?.headers?.get?.('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 60_000);
  return attempt === 1 ? 5_000 : 15_000;
}

function createProviderError(status, attempts, cause, retryAfterMs) {
  const quotaExceeded = status === 429;
  const error = new Error(quotaExceeded
    ? 'El análisis inteligente alcanzó temporalmente su límite. Reintentá en unos minutos.'
    : 'El servicio de análisis de imágenes no está disponible temporalmente.');
  error.statusCode = quotaExceeded ? 429 : 503;
  error.providerStatus = status || null;
  error.code = quotaExceeded ? 'IMAGE_ANALYSIS_RATE_LIMITED' : 'IMAGE_ANALYSIS_UNAVAILABLE';
  error.retryable = true;
  error.attempts = attempts;
  error.retryAfterSeconds = Math.max(1, Math.ceil((retryAfterMs || (quotaExceeded ? RATE_LIMIT_COOLDOWN_MS : UNAVAILABLE_COOLDOWN_MS)) / 1000));
  if (cause) error.cause = cause;
  return error;
}

async function requestAnalysis({ url, options, fetchImpl, waitImpl, timeoutMs }) {
  const now = Date.now();
  if (analysisUnavailableUntil > now) {
    const remainingMs = analysisUnavailableUntil - now;
    throw createProviderError(429, 0, undefined, remainingMs);
  }

  let lastStatus = null;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { ...options, signal: controller.signal });
      lastStatus = response.status || null;
      if (response.ok) return { response, attempts: attempt };
      if (response.status === 429) {
        const cooldownMs = Math.max(getRetryDelay(response, attempt), RATE_LIMIT_COOLDOWN_MS);
        analysisUnavailableUntil = Date.now() + cooldownMs;
        throw createProviderError(response.status, attempt, undefined, cooldownMs);
      }
      if (!RETRYABLE_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS) {
        if (RETRYABLE_STATUSES.has(response.status)) {
          analysisUnavailableUntil = Date.now() + UNAVAILABLE_COOLDOWN_MS;
          throw createProviderError(response.status, attempt, undefined, UNAVAILABLE_COOLDOWN_MS);
        }
        const error = new Error('El servicio de análisis rechazó la solicitud.');
        error.statusCode = response.status === 401 || response.status === 403 ? 503 : 502;
        error.providerStatus = response.status;
        error.code = 'IMAGE_ANALYSIS_REQUEST_REJECTED';
        error.retryable = false;
        error.attempts = attempt;
        throw error;
      }
      await waitImpl(getRetryDelay(response, attempt));
    } catch (error) {
      if (error.code?.startsWith('IMAGE_ANALYSIS_')) throw error;
      lastError = error;
      if (attempt === MAX_ATTEMPTS) {
        analysisUnavailableUntil = Date.now() + UNAVAILABLE_COOLDOWN_MS;
        throw createProviderError(lastStatus, attempt, error, UNAVAILABLE_COOLDOWN_MS);
      }
      await waitImpl(attempt === 1 ? 5_000 : 15_000);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw createProviderError(lastStatus, MAX_ATTEMPTS, lastError);
}

async function analyzeProductImage({
  imageData,
  categoryNames = [],
  fetchImpl = fetch,
  waitImpl = wait,
  timeoutMs = DEFAULT_TIMEOUT_MS
}) {
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
  const { response } = await requestAnalysis({
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    fetchImpl,
    waitImpl,
    timeoutMs,
    options: {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.data } }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: PRODUCT_SCHEMA, temperature: 0.1 }
    })
    }
  });

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
  if (!text) throw Object.assign(new Error('No pudimos reconocer información del producto'), { statusCode: 422 });

  try {
    return sanitizeDraft(JSON.parse(text), categoryNames);
  } catch {
    throw Object.assign(new Error('La respuesta del análisis no tuvo un formato válido'), { statusCode: 502 });
  }
}

module.exports = { analyzeProductImage, parseImageData, sanitizeDraft, getRetryDelay };
