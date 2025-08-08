const https = require('https');

// Keep-alive para mantener Render despierto
const RENDER_URL = 'https://hogarconectado-backend.onrender.com';

function pingServer() {
  const options = {
    hostname: 'hogarconectado-backend.onrender.com',
    path: '/api/categorias',
    method: 'GET',
    timeout: 8000
  };

  const req = https.request(options, (res) => {
    console.log(`✅ Ping exitoso: ${new Date().toLocaleTimeString()} - Status: ${res.statusCode}`);
  });

  req.on('error', (err) => {
    console.log(`❌ Error en ping: ${new Date().toLocaleTimeString()} - ${err.message}`);
  });

  req.on('timeout', () => {
    console.log(`⏰ Timeout en ping: ${new Date().toLocaleTimeString()}`);
    req.destroy();
  });

  req.end();
}

// Ping cada 5 minutos durante horario activo
const INTERVAL = 5 * 60 * 1000; // 5 minutos

console.log('🚀 Iniciando keep-alive para Render...');
console.log('📊 Ping cada 5 minutos durante horario activo');

// Ejecutar inmediatamente
pingServer();

// Ejecutar cada 5 minutos
setInterval(pingServer, INTERVAL);
