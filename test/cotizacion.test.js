const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Cotizacion = require('../models/Cotizacion');

function makeQuote(modalidadPago) {
  return new Cotizacion({
    datosContacto: { nombre: 'Cliente', telefono: '1123456789' },
    modalidadPago,
    creadaPor: new mongoose.Types.ObjectId(),
    productos: [{
      producto: new mongoose.Types.ObjectId(),
      cantidad: 2,
      detalles: {
        marca: 'Marca', modelo: 'Modelo', precioBase: 100,
        precios: {
          contado: 130,
          tresCuotas: { total: 150, cuota: 50 },
          seisCuotas: { total: 180, cuota: 30 }
        }
      }
    }]
  });
}

test('calcula el total según modalidad y cantidad', () => {
  const contado = makeQuote('contado');
  assert.equal(contado.calcularTotales().total, 260);
  const tres = makeQuote('3-cuotas');
  assert.equal(tres.calcularTotales().total, 300);
  const seis = makeQuote('6-cuotas');
  assert.equal(seis.calcularTotales().total, 360);
});
