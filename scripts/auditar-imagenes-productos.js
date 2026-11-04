#!/usr/bin/env node

const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.atlas') });

const Producto = require('../models/Producto');

const isPrivateHost = hostname => {
  const normalized = hostname.toLowerCase();
  if (normalized === 'localhost' || normalized === '::1') return true;
  if (/^127\./.test(normalized) || /^10\./.test(normalized) || /^192\.168\./.test(normalized)) return true;
  const match = normalized.match(/^172\.(\d+)\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
};

const inspectUrl = async (url, timeoutMs) => {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { status: 'invalid-url' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return { status: 'invalid-url' };
  if (isPrivateHost(parsed.hostname)) return { status: 'private-host' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal
    });
    return {
      status: response.ok ? 'ok' : 'http-error',
      httpStatus: response.status,
      contentType: response.headers.get('content-type')
    };
  } catch (error) {
    return {
      status: error.name === 'AbortError' ? 'timeout' : 'network-error',
      error: error.name
    };
  } finally {
    clearTimeout(timeout);
  }
};

const mapWithConcurrency = async (items, concurrency, worker) => {
  const results = new Array(items.length);
  let nextIndex = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  });

  await Promise.all(runners);
  return results;
};

const getPositiveInteger = (name, fallback) => {
  const prefix = `--${name}=`;
  const argument = process.argv.find(value => value.startsWith(prefix));
  if (!argument) return fallback;
  const parsed = Number.parseInt(argument.slice(prefix.length), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`Valor inválido para --${name}`);
  return parsed;
};

const main = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI no está configurada');

  const concurrency = getPositiveInteger('concurrency', 8);
  const timeoutMs = getPositiveInteger('timeout-ms', 10000);
  await mongoose.connect(process.env.MONGODB_URI);

  const products = await Producto.find({
    activo: { $ne: false },
    'stock.disponible': true,
    'stock.cantidad': { $gt: 0 }
  }).select('_id marca modelo imagenes imagenPublicIds').lean();

  const withoutImage = products.filter(product => !product.imagenes?.[0]);
  const withImage = products.filter(product => product.imagenes?.[0]);
  const checked = await mapWithConcurrency(withImage, concurrency, async product => ({
    id: String(product._id),
    marca: product.marca,
    modelo: product.modelo,
    imageUrl: product.imagenes[0],
    publicId: product.imagenPublicIds?.[0] || null,
    ...await inspectUrl(product.imagenes[0], timeoutMs)
  }));

  const failures = checked.filter(result => result.status !== 'ok');
  const statusCounts = checked.reduce((counts, result) => {
    counts[result.status] = (counts[result.status] || 0) + 1;
    return counts;
  }, {});

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    database: mongoose.connection.name,
    collection: Producto.collection.collectionName,
    scope: 'Productos activos con stock disponible',
    totals: {
      products: products.length,
      withImage: withImage.length,
      withoutImage: withoutImage.length,
      validImages: checked.length - failures.length,
      invalidImages: failures.length
    },
    statusCounts,
    withoutImage: withoutImage.map(product => ({
      id: String(product._id),
      marca: product.marca,
      modelo: product.modelo
    })),
    failures
  }, null, 2));

  if (withoutImage.length > 0 || failures.length > 0) process.exitCode = 2;
};

if (require.main === module) {
  main()
    .catch(error => {
      console.error(`${error.name}: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => mongoose.disconnect());
}

module.exports = { inspectUrl, isPrivateHost, mapWithConcurrency };
