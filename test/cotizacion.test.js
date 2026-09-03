const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Cotizacion = require('../models/Cotizacion');
const Producto = require('../models/Producto');

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
        porcentajeAplicado: 30,
        precios: {
          contado: 130,
          factura: { costoBase: 105, unPago: 136.5 },
          tresCuotas: { costoBase: 120, total: 150, cuota: 50 },
          seisCuotas: { costoBase: 140, total: 180, cuota: 30 }
        }
      }
    }]
  });
}

test('calcula el total según modalidad y cantidad', () => {
  const contado = makeQuote('contado');
  assert.equal(contado.calcularTotales().total, 260);
  const facturado = makeQuote('facturado');
  assert.equal(facturado.calcularTotales().total, 273);
  const tres = makeQuote('3-cuotas');
  assert.equal(tres.calcularTotales().total, 300);
  const seis = makeQuote('6-cuotas');
  assert.equal(seis.calcularTotales().total, 360);
});

test('conserva el porcentaje aplicado junto al snapshot de precios', () => {
  const cotizacion = makeQuote('contado');
  assert.equal(cotizacion.productos[0].detalles.porcentajeAplicado, 30);
  assert.equal(cotizacion.productos[0].detalles.precios.contado, 130);
  assert.equal(cotizacion.productos[0].detalles.precios.factura.costoBase, 105);
});

test('calcula dinero a rendir y ganancia según la modalidad confirmada', () => {
  const contado = makeQuote('contado');
  contado.calcularTotales();
  assert.deepEqual(contado.calcularResumenConfirmacion().toObject(), {
    totalVendido: 260,
    dineroARendir: 200,
    gananciaVendedor: 60
  });

  const facturado = makeQuote('facturado');
  facturado.calcularTotales();
  assert.deepEqual(facturado.calcularResumenConfirmacion().toObject(), {
    totalVendido: 273,
    dineroARendir: 210,
    gananciaVendedor: 63
  });

  const tres = makeQuote('3-cuotas');
  tres.calcularTotales();
  assert.deepEqual(tres.calcularResumenConfirmacion().toObject(), {
    totalVendido: 300,
    dineroARendir: 240,
    gananciaVendedor: 60
  });

  const seis = makeQuote('6-cuotas');
  seis.calcularTotales();
  assert.deepEqual(seis.calcularResumenConfirmacion().toObject(), {
    totalVendido: 360,
    dineroARendir: 280,
    gananciaVendedor: 80
  });
});

test('el mensaje informa cuota y total para modalidades financiadas', () => {
  const tres = makeQuote('3-cuotas');
  tres.calcularTotales();
  const mensaje = tres.generarMensajeWhatsApp();

  assert.match(mensaje, /Total: \$300/);
  assert.match(mensaje, /3 cuotas de \$100/);
  assert.match(mensaje, /Modalidad: 3 cuotas/);
});

test('permite serializar proyecciones de producto sin ejecutar virtuales de precio', () => {
  const productoProyectado = new Producto({
    categoria: new mongoose.Types.ObjectId(),
    marca: 'Marca',
    modelo: 'Modelo'
  });

  assert.doesNotThrow(() => {
    JSON.stringify(productoProyectado.toObject({ virtuals: false }));
  });
});
