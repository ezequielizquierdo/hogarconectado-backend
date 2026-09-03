const test = require('node:test');
const assert = require('node:assert/strict');
const { parseImageData, sanitizeDraft, analyzeProductImage } = require('../services/productImageAnalysis');

test('parseImageData acepta imágenes soportadas y rechaza contenido ajeno', () => {
  assert.equal(parseImageData('data:image/png;base64,aG9sYQ==').mimeType, 'image/png');
  assert.throws(() => parseImageData('data:text/plain;base64,aG9sYQ=='), /Formato de imagen inválido/);
});

test('sanitizeDraft normaliza números, textos y categorías existentes', () => {
  const draft = sanitizeDraft({
    marca: '  ACME  ', modelo: ' X  1 ', categoriaSugerida: 'heladeras', descripcion: ' Frío  total ',
    precioBase: 125000, stockCantidad: 2, stockDisponible: true, confianza: 1.4, advertencias: [' Revisar color ']
  }, ['Heladeras']);
  assert.deepEqual(draft, {
    marca: 'ACME', modelo: 'X 1', categoriaSugerida: 'Heladeras', descripcion: 'Frío total',
    precioBase: 125000, stockCantidad: 2, stockDisponible: true, confianza: 1, advertencias: ['Revisar color']
  });
});

test('analyzeProductImage envía la imagen y devuelve un borrador', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  let requestBody;
  const fetchImpl = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
      marca: 'Marca', modelo: 'M1', categoriaSugerida: 'Audio', descripcion: 'Parlante', precioBase: 100,
      stockCantidad: null, stockDisponible: null, confianza: 0.8, advertencias: ['Stock no visible']
    }) }] } }] }) };
  };
  try {
    const result = await analyzeProductImage({ imageData: 'data:image/jpeg;base64,aG9sYQ==', categoryNames: ['Audio'], fetchImpl });
    assert.equal(result.modelo, 'M1');
    assert.equal(result.stockCantidad, 0);
    assert.equal(requestBody.contents[0].parts[1].inlineData.mimeType, 'image/jpeg');
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});
