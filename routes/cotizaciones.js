const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Cotizacion = require('../models/Cotizacion');
const Producto = require('../models/Producto');
const Consulta = require('../models/Consulta');
const ProductoPrecioHistorial = require('../models/ProductoPrecioHistorial');
const { canAccessOwnedResource, requireRoles } = require('../middleware/auth');
const { getProductPricingConfig } = require('../utils/pricing');
const { buildQuoteOwnershipFilter } = require('../utils/sellerAccess');
const { createPublicQuoteToken, hashPublicQuoteToken } = require('../utils/publicQuoteToken');
const { CATALOG_AVAILABILITY_STATES, canTransitionCatalogAvailability } = require('../utils/catalogAvailability');

const router = express.Router();

function serializeForUser(cotizacion, user) {
  const source = typeof cotizacion.toObject === 'function'
    ? cotizacion.toObject({ virtuals: false })
    // Una copia superficial conserva los ObjectId y permite que Express use
    // su toJSON(). structuredClone() les quitaba el prototipo y el frontend
    // recibía objetos que terminaban convertidos en "[object Object]".
    : { ...cotizacion };
  const incluyeCatalogo = source.productos?.some(item => item.detalles?.tipoComercializacion === 'venta-catalogo');
  if (incluyeCatalogo) {
    source.disponibilidadCatalogo = {
      ...(source.disponibilidadCatalogo || {}),
      requerida: true,
      estado: source.disponibilidadCatalogo?.estado || 'pendiente'
    };
  }
  if (user.rol !== 'vendedor') return source;
  delete source.tipoLiquidacion;
  if (source.resumenConfirmacion) {
    source.resumenConfirmacion = {
      totalVendido: source.resumenConfirmacion.totalVendido,
      dineroARendir: source.resumenConfirmacion.dineroARendir,
      gananciaVendedor: source.resumenConfirmacion.gananciaVendedor
    };
  }
  source.productos = source.productos.map(item => {
    const precios = item.detalles?.precios || {};
    return {
      ...item,
      detalles: {
        categoria: item.detalles?.categoria,
        marca: item.detalles?.marca,
        modelo: item.detalles?.modelo,
        tipoComercializacion: item.detalles?.tipoComercializacion || 'stock-propio',
        catalogo: item.detalles?.tipoComercializacion === 'venta-catalogo'
          ? item.detalles?.catalogo
          : undefined,
        precios: {
          contado: precios.contado,
          factura: { unPago: precios.factura?.unPago },
          tresCuotas: { total: precios.tresCuotas?.total, cuota: precios.tresCuotas?.cuota },
          seisCuotas: { total: precios.seisCuotas?.total, cuota: precios.seisCuotas?.cuota }
        }
      }
    };
  });
  return source;
}

function getMonthRange(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value || ''));
  const now = new Date();
  const year = match ? Number(match[1]) : now.getFullYear();
  const month = match ? Number(match[2]) - 1 : now.getMonth();
  if (month < 0 || month > 11) return null;
  return { start: new Date(year, month, 1), end: new Date(year, month + 1, 1), key: `${year}-${String(month + 1).padStart(2, '0')}` };
}

const validators = [
  body('datosContacto.nombre').trim().isLength({ min: 2, max: 100 }),
  body('datosContacto.telefono').trim().isLength({ min: 8, max: 20 }),
  body('productos').isArray({ min: 1 }),
  body('productos.*.producto').isMongoId(),
  body('productos.*.cantidad').isInt({ min: 1 }),
  body('productos.*.porcentajeAplicado').optional().isFloat({ min: 0, max: 100 }),
  body('modalidadPago').optional().isIn(['contado', 'facturado', '3-cuotas', '6-cuotas'])
];

async function findAuthorized(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ success: false, message: 'Identificador de cotización inválido' });
    return null;
  }
  const cotizacion = await Cotizacion.findById(req.params.id);
  if (!cotizacion) {
    res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    return null;
  }
  if (!canAccessOwnedResource(cotizacion.creadaPor, req.user)) {
    res.status(403).json({ success: false, message: 'No tenés acceso a esta cotización' });
    return null;
  }
  return cotizacion;
}

router.post('/', validators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
    }

    const { datosContacto, productos, modalidadPago, observaciones } = req.body;
    const productosIds = productos.map(item => item.producto);
    const encontrados = await Producto.find({ _id: { $in: productosIds }, activo: true })
      .populate('categoria', 'nombre');
    if (encontrados.length !== new Set(productosIds).size) {
      return res.status(400).json({ success: false, message: 'Uno o más productos no existen o no están disponibles' });
    }

    const cotizacion = new Cotizacion({
      datosContacto,
      modalidadPago: modalidadPago || 'contado',
      observaciones,
      creadaPor: req.user._id,
      tipoLiquidacion: req.user.rol === 'vendedor' ? 'vendedor-50-margen' : 'operacion-interna',
      disponibilidadCatalogo: {
        requerida: encontrados.some(producto => producto.tipoComercializacion === 'venta-catalogo'),
        estado: encontrados.some(producto => producto.tipoComercializacion === 'venta-catalogo') ? 'pendiente' : undefined
      },
      productos: productos.map(item => {
        const producto = encontrados.find(found => found._id.toString() === item.producto);
        const config = getProductPricingConfig(producto.porcentajeGanancia, process.env);
        const porcentajeAplicado = config.ganancia * 100;
        const precios = producto.calcularCuotas();
        return {
          producto: producto._id,
          cantidad: item.cantidad,
          detalles: {
            categoria: producto.categoria.nombre,
            marca: producto.marca,
            modelo: producto.modelo,
            tipoComercializacion: producto.tipoComercializacion || 'stock-propio',
            catalogo: producto.tipoComercializacion === 'venta-catalogo'
              ? {
                  nombre: producto.catalogo?.nombre,
                  campania: producto.catalogo?.campania,
                  vigenciaHasta: producto.catalogo?.vigenciaHasta,
                  plazoEntrega: producto.catalogo?.plazoEntrega
                }
              : undefined,
            precioBase: producto.precioBase,
            porcentajeAplicado,
            precios
          }
        };
      })
    });
    cotizacion.calcularTotales();
    await cotizacion.save();
    res.status(201).json({ success: true, message: 'Cotización creada exitosamente', data: serializeForUser(cotizacion, req.user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear cotización' });
  }
});

router.get('/estadisticas/resumen', requireRoles('editor', 'admin', 'vendedor'), async (req, res) => {
  try {
    const hoy = new Date();
    const inicioDia = new Date(hoy); inicioDia.setHours(0, 0, 0, 0);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioSemana = new Date(inicioDia); inicioSemana.setDate(inicioDia.getDate() - inicioDia.getDay());
    const ownershipFilter = buildQuoteOwnershipFilter(req.user);
    const [total, dia, semana, mes, porEstado, liquidacion, historialMensual] = await Promise.all([
      Cotizacion.countDocuments(ownershipFilter),
      Cotizacion.countDocuments({ ...ownershipFilter, createdAt: { $gte: inicioDia } }),
      Cotizacion.countDocuments({ ...ownershipFilter, createdAt: { $gte: inicioSemana } }),
      Cotizacion.countDocuments({ ...ownershipFilter, createdAt: { $gte: inicioMes } }),
      Cotizacion.aggregate([{ $match: ownershipFilter }, { $group: { _id: '$estado', count: { $sum: 1 } } }]),
      Cotizacion.aggregate([
        { $match: { ...ownershipFilter, estado: 'confirmada' } },
        { $group: {
          _id: null,
          totalVendido: { $sum: '$resumenConfirmacion.totalVendido' },
          dineroARendir: { $sum: '$resumenConfirmacion.dineroARendir' },
          gananciaVendedor: { $sum: '$resumenConfirmacion.gananciaVendedor' }
        } }
      ]),
      Cotizacion.aggregate([
        { $match: { ...ownershipFilter, estado: 'confirmada', confirmadaAt: { $exists: true } } },
        { $group: {
          _id: { year: { $year: '$confirmadaAt' }, month: { $month: '$confirmadaAt' } },
          ventas: { $sum: 1 },
          montoVendido: { $sum: '$resumenConfirmacion.totalVendido' },
          ganancia: { $sum: '$resumenConfirmacion.gananciaVendedor' }
        } },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])
    ]);
    res.json({ success: true, data: {
      total, hoy: dia, semana, mes,
      porEstado: Object.fromEntries(porEstado.map(item => [item._id, item.count])),
      liquidacion: liquidacion[0] || { totalVendido: 0, dineroARendir: 0, gananciaVendedor: 0 },
      historialMensual: historialMensual.map(item => ({
        periodo: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        ventas: item.ventas,
        montoVendido: item.montoVendido,
        ganancia: item.ganancia
      }))
    } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
});

router.get('/estadisticas/tablero', requireRoles('admin'), async (req, res) => {
  try {
    const range = getMonthRange(req.query.mes);
    if (!range) return res.status(400).json({ success: false, message: 'Mes inválido; usá AAAA-MM' });
    const saleMatch = { estado: 'confirmada', confirmadaAt: { $gte: range.start, $lt: range.end } };
    const queryMatch = { createdAt: { $gte: range.start, $lt: range.end } };
    const [ranking, vendidos, consultados, variaciones] = await Promise.all([
      Cotizacion.aggregate([
        { $match: saleMatch },
        { $group: { _id: '$creadaPor', ventas: { $sum: 1 }, montoVendido: { $sum: '$resumenConfirmacion.totalVendido' }, ganancia: { $sum: '$resumenConfirmacion.gananciaVendedor' } } },
        { $sort: { ventas: -1, montoVendido: -1 } },
        { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'vendedor' } },
        { $unwind: '$vendedor' },
        { $match: { 'vendedor.rol': 'vendedor' } },
        { $project: { _id: 0, vendedorId: '$_id', nombre: '$vendedor.nombre', ventas: 1, montoVendido: 1, ganancia: 1 } }
      ]),
      Cotizacion.aggregate([
        { $match: saleMatch }, { $unwind: '$productos' },
        { $group: { _id: '$productos.producto', marca: { $first: '$productos.detalles.marca' }, modelo: { $first: '$productos.detalles.modelo' }, unidades: { $sum: '$productos.cantidad' }, monto: { $sum: { $multiply: ['$productos.cantidad', '$productos.detalles.precios.contado'] } } } },
        { $sort: { unidades: -1, monto: -1 } }, { $limit: 10 }
      ]),
      Consulta.aggregate([
        { $match: queryMatch },
        { $project: { items: { $cond: [{ $gt: [{ $size: { $ifNull: ['$productos', []] } }, 0] }, '$productos', [{ producto: '$producto', productoSnapshot: '$productoSnapshot' }]] } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.producto', marca: { $first: '$items.productoSnapshot.marca' }, modelo: { $first: '$items.productoSnapshot.modelo' }, consultas: { $sum: 1 } } },
        { $sort: { consultas: -1 } }, { $limit: 10 }
      ]),
      ProductoPrecioHistorial.aggregate([
        { $match: { createdAt: { $lt: range.end } } },
        { $project: { producto: 1, precios: ['$precioAnterior', '$precioNuevo'], createdAt: 1 } },
        { $unwind: '$precios' },
        { $group: { _id: '$producto', minimo: { $min: '$precios' }, maximo: { $max: '$precios' }, registros: { $addToSet: '$createdAt' }, ultimaVariacion: { $max: '$createdAt' } } },
        { $addFields: { cambios: { $size: '$registros' } } },
        { $addFields: { variacionAbsoluta: { $subtract: ['$maximo', '$minimo'] } } },
        { $sort: { variacionAbsoluta: -1, cambios: -1 } }, { $limit: 10 },
        { $lookup: { from: 'productos', localField: '_id', foreignField: '_id', as: 'producto' } },
        { $unwind: '$producto' },
        { $project: { _id: 0, productoId: '$_id', marca: '$producto.marca', modelo: '$producto.modelo', minimo: 1, maximo: 1, cambios: 1, variacionAbsoluta: 1, ultimaVariacion: 1 } }
      ])
    ]);
    return res.json({ success: true, data: { periodo: range.key, rankingVendedores: ranking, productosMasVendidos: vendidos, productosMasConsultados: consultados, productosMayorVariacion: variaciones } });
  } catch {
    return res.status(500).json({ success: false, message: 'No pudimos generar el tablero comercial' });
  }
});

router.post('/:id/enlace-publico', async (req, res) => {
  try {
    const cotizacion = await findAuthorized(req, res);
    if (!cotizacion) return;
    if (cotizacion.estado === 'cancelada') {
      return res.status(409).json({ success: false, message: 'Esta cotización ya no admite un nuevo enlace de aceptación' });
    }
    const token = createPublicQuoteToken();
    const accesoPublico = {
      tokenHash: hashPublicQuoteToken(token),
      emitidoAt: new Date(),
      venceAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    const estado = cotizacion.estado === 'pendiente' ? 'enviada' : cotizacion.estado;
    await Cotizacion.updateOne(
      { _id: cotizacion._id },
      { $set: { accesoPublico, estado } }
    );
    cotizacion.accesoPublico = accesoPublico;
    cotizacion.estado = estado;
    const frontendUrl = (process.env.FRONTEND_URL || 'https://hogarconectado.onrender.com').replace(/\/$/, '');
    return res.json({
      success: true,
      data: { url: `${frontendUrl}/cotizacion.html?token=${encodeURIComponent(token)}`, venceAt: accesoPublico.venceAt },
      message: 'Enlace de aceptación generado'
    });
  } catch {
    return res.status(500).json({ success: false, message: 'No pudimos generar el enlace' });
  }
});

router.get('/', async (req, res) => {
  try {
    const limite = Math.max(1, Math.min(Number.parseInt(req.query.limite) || 20, 100));
    const pagina = Math.max(1, Number.parseInt(req.query.pagina) || 1);
    const filtros = ['consulta', 'vendedor'].includes(req.user.rol) ? { creadaPor: req.user._id } : {};
    if (req.query.operacion === 'por-confirmar') {
      filtros['aceptacionCliente.aceptadaAt'] = { $exists: true };
      filtros['productos.detalles.tipoComercializacion'] = 'venta-catalogo';
      filtros.$and = [{ $or: [
        { 'disponibilidadCatalogo.estado': 'pendiente' },
        { 'disponibilidadCatalogo.estado': { $exists: false } }
      ] }];
    }
    if (req.query.estado && req.query.estado !== 'todas') filtros.estado = req.query.estado;
    if (req.query.fechaDesde || req.query.fechaHasta) {
      filtros.createdAt = {};
      if (req.query.fechaDesde) filtros.createdAt.$gte = new Date(req.query.fechaDesde);
      if (req.query.fechaHasta) filtros.createdAt.$lte = new Date(req.query.fechaHasta);
    }
    if (req.query.buscar) {
      const searchFilter = { $or: [
        { 'datosContacto.nombre': new RegExp(req.query.buscar, 'i') },
        { 'datosContacto.telefono': new RegExp(req.query.buscar, 'i') }
      ] };
      if (filtros.$and) filtros.$and.push(searchFilter);
      else filtros.$or = searchFilter.$or;
    }

    const [data, total] = await Promise.all([
      Cotizacion.find(filtros)
        .populate('productos.producto', 'marca modelo categoria')
        .populate('creadaPor', 'nombre email')
        .populate('confirmadaPor', 'nombre email')
        .populate('aceptacionCliente.pedido', 'estado reservadoAt reservaVenceAt')
        // El historial usa los snapshots de la cotización. `lean()` evita que
        // los virtuales de Producto intenten recalcular precios con una
        // proyección que deliberadamente no incluye `precioBase`.
        .sort({ createdAt: -1 }).skip((pagina - 1) * limite).limit(limite).lean(),
      Cotizacion.countDocuments(filtros)
    ]);
    res.json({ success: true, data: data.map(item => serializeForUser(item, req.user)), pagination: { pagina, limite, total, paginas: Math.ceil(total / limite) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener cotizaciones' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cotizacion = await findAuthorized(req, res);
    if (!cotizacion) return;
    await cotizacion.populate('productos.producto', 'marca modelo categoria descripcion');
    await cotizacion.populate('confirmadaPor', 'nombre email');
    await cotizacion.populate('aceptacionCliente.pedido', 'estado reservadoAt reservaVenceAt');
    res.json({
      success: true,
      data: serializeForUser(cotizacion, req.user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener cotización' });
  }
});

router.put('/:id/estado', [
  body('estado').isIn(['pendiente', 'enviada', 'confirmada', 'cancelada']),
  body('compradorNombre').if(body('estado').equals('confirmada')).trim().isLength({ min: 2, max: 100 }),
  body('entregaAcordada').if(body('estado').equals('confirmada')).trim().isLength({ min: 3, max: 500 }),
  body('agregarEnvio').if(body('estado').equals('confirmada')).isBoolean(),
  body('disponibilidadCatalogoConfirmada').optional().isBoolean(),
  body('costoEnvio').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const cotizacion = await findAuthorized(req, res);
    if (!cotizacion) return;
    cotizacion.estado = req.body.estado;
    if (req.body.estado === 'confirmada') {
      const incluyeCatalogo = cotizacion.productos.some(item => item.detalles?.tipoComercializacion === 'venta-catalogo');
      if (incluyeCatalogo && req.body.disponibilidadCatalogoConfirmada !== true) {
        return res.status(409).json({
          success: false,
          message: 'Confirmá la disponibilidad de los productos de catálogo antes de cerrar la venta'
        });
      }
      cotizacion.confirmadaPor = req.user._id;
      cotizacion.confirmadaAt = new Date();
      if (incluyeCatalogo) {
        cotizacion.disponibilidadCatalogo = {
          requerida: true,
          estado: 'disponible',
          observacion: cotizacion.disponibilidadCatalogo?.observacion,
          actualizadaAt: cotizacion.disponibilidadCatalogo?.actualizadaAt || new Date(),
          actualizadaPor: cotizacion.disponibilidadCatalogo?.actualizadaPor || req.user._id,
          confirmadaAt: new Date(),
          confirmadaPor: req.user._id
        };
      }
      cotizacion.venta = {
        compradorNombre: req.body.compradorNombre,
        entregaAcordada: req.body.entregaAcordada,
        agregarEnvio: req.body.agregarEnvio,
        costoEnvio: req.body.agregarEnvio ? Number(req.body.costoEnvio || 0) : 0,
        estadoPago: 'pendiente',
        estadoEntrega: 'pendiente'
      };
      cotizacion.calcularResumenConfirmacion();
    }
    await cotizacion.save();
    await cotizacion.populate('confirmadaPor', 'nombre email');
    res.json({ success: true, data: serializeForUser(cotizacion, req.user), message: 'Estado actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar estado' });
  }
});

router.patch('/:id/disponibilidad-catalogo', [
  body('estado').isIn(CATALOG_AVAILABILITY_STATES),
  body('observacion').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Estado de disponibilidad inválido' });
  const cotizacion = await findAuthorized(req, res);
  if (!cotizacion) return;
  const incluyeCatalogo = cotizacion.productos.some(item => item.detalles?.tipoComercializacion === 'venta-catalogo');
  if (!incluyeCatalogo) {
    return res.status(409).json({ success: false, message: 'La cotización no contiene productos de catálogo' });
  }
  const current = cotizacion.disponibilidadCatalogo.estado || 'pendiente';
  if (!canTransitionCatalogAvailability(current, req.body.estado)) {
    return res.status(409).json({ success: false, message: `No se puede pasar de ${current} a ${req.body.estado}` });
  }
  cotizacion.disponibilidadCatalogo.requerida = true;
  cotizacion.disponibilidadCatalogo.estado = req.body.estado;
  cotizacion.disponibilidadCatalogo.observacion = req.body.observacion || undefined;
  cotizacion.disponibilidadCatalogo.actualizadaAt = new Date();
  cotizacion.disponibilidadCatalogo.actualizadaPor = req.user._id;
  if (req.body.estado === 'disponible') {
    cotizacion.disponibilidadCatalogo.confirmadaAt = new Date();
    cotizacion.disponibilidadCatalogo.confirmadaPor = req.user._id;
  } else if (req.body.estado === 'pendiente' || req.body.estado === 'no-disponible') {
    cotizacion.disponibilidadCatalogo.confirmadaAt = undefined;
    cotizacion.disponibilidadCatalogo.confirmadaPor = undefined;
  }
  await cotizacion.save();
  return res.json({ success: true, data: serializeForUser(cotizacion, req.user), message: 'Disponibilidad actualizada' });
});

router.patch('/:id/venta', requireRoles('admin'), [
  body('estadoPago').optional().isIn(['pendiente', 'parcial', 'confirmado']),
  body('estadoEntrega').optional().isIn(['pendiente', 'coordinada', 'entregada', 'cancelada'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Estado de venta inválido' });
  const cotizacion = await Cotizacion.findOne({ _id: req.params.id, estado: 'confirmada' });
  if (!cotizacion) return res.status(404).json({ success: false, message: 'Venta confirmada no encontrada' });
  if (req.body.estadoPago) cotizacion.venta.estadoPago = req.body.estadoPago;
  if (req.body.estadoEntrega) cotizacion.venta.estadoEntrega = req.body.estadoEntrega;
  await cotizacion.save();
  await cotizacion.populate('confirmadaPor', 'nombre email');
  return res.json({ success: true, data: cotizacion, message: 'Seguimiento de venta actualizado' });
});

router.get('/:id/mensaje', async (req, res) => {
  try {
    const cotizacion = await findAuthorized(req, res);
    if (!cotizacion) return;
    if (cotizacion.estado === 'cancelada') {
      return res.status(409).json({ success: false, message: 'Esta cotización ya no puede enviarse para aceptación' });
    }
    const mensajeBase = cotizacion.generarMensajeWhatsApp();
    const telefono = String(cotizacion.datosContacto?.telefono || '').replace(/\D/g, '');
    const token = createPublicQuoteToken();
    const accesoPublico = {
      tokenHash: hashPublicQuoteToken(token),
      emitidoAt: new Date(),
      venceAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    const estado = cotizacion.estado === 'pendiente' ? 'enviada' : cotizacion.estado;
    try {
      // La actualización atómica evita revalidar snapshots históricos completos.
      await Cotizacion.updateOne(
        { _id: cotizacion._id },
        { $set: { accesoPublico, estado } }
      );
    } catch (error) {
      // Compartir el detalle sigue siendo útil aunque el enlace de aceptación
      // no pueda persistirse temporalmente.
      console.error('Error al guardar enlace público de cotización:', error.message);
      return res.json({ success: true, data: {
        mensaje: mensajeBase,
        telefono,
        enlaceCotizacion: null,
        urlWhatsApp: `https://wa.me/${telefono}?text=${encodeURIComponent(mensajeBase)}`,
        advertencia: 'La cotización puede compartirse, pero el enlace de aceptación no está disponible temporalmente'
      } });
    }
    cotizacion.accesoPublico = accesoPublico;
    cotizacion.estado = estado;
    const frontendUrl = (process.env.FRONTEND_URL || 'https://hogarconectado.onrender.com').replace(/\/$/, '');
    const enlaceCotizacion = `${frontendUrl}/cotizacion.html?token=${encodeURIComponent(token)}`;
    const mensaje = `${cotizacion.generarMensajeWhatsApp()}\n\nRevisá y aceptá la cotización acá:\n${enlaceCotizacion}`;
    res.json({ success: true, data: {
      mensaje,
      telefono,
      enlaceCotizacion,
      urlWhatsApp: `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
    } });
  } catch (error) {
    console.error('Error al generar mensaje de cotización:', error.message);
    res.status(500).json({ success: false, message: 'Error al generar mensaje' });
  }
});

router.delete('/:id', requireRoles('admin'), async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findByIdAndDelete(req.params.id);
    if (!cotizacion) return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    res.json({ success: true, message: 'Cotización eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar cotización' });
  }
});

module.exports = router;
module.exports.serializeForUser = serializeForUser;
