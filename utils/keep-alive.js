const cron = require('node-cron');
const https = require('https');

// Función para hacer ping al servidor
function pingServer() {
  const options = {
    hostname: 'hogarconectado-backend.onrender.com',
    path: '/api/categorias',
    method: 'GET',
    timeout: 30000,
    headers: {
      'User-Agent': 'Render-KeepAlive/1.0'
    }
  };

  console.log(`🏃 Ping iniciado: ${new Date().toISOString()}`);
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`✅ Ping exitoso: ${res.statusCode} - ${data.length} bytes - ${new Date().toISOString()}`);
    });
  });

  req.on('error', (err) => {
    console.log(`❌ Error en ping: ${err.message} - ${new Date().toISOString()}`);
  });

  req.on('timeout', () => {
    console.log(`⏰ Timeout en ping (30s) - ${new Date().toISOString()}`);
    req.destroy();
  });

  req.end();
}

// Solo ejecutar en producción
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  console.log('🚀 Iniciando sistema de keep-alive para Render...');
  
  // Ping cada 5 minutos para mantener el servidor activo
  cron.schedule('*/5 * * * *', () => {
    pingServer();
  });

  // Ping inicial después de 30 segundos
  setTimeout(() => {
    pingServer();
  }, 30000);
  
  console.log('📅 Keep-alive programado: cada 5 minutos');
} else {
  console.log('⚠️ Keep-alive deshabilitado en desarrollo');
}

module.exports = { pingServer };
