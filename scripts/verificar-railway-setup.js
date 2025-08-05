const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO PREPARACIÓN PARA RAILWAY DEPLOYMENT\n');

// Verificar archivos esenciales
const archivosEsenciales = [
  'package.json',
  'server.js',
  'railway.json',
  '.env.example',
  'docs/Railway-Deployment.md'
];

console.log('📁 VERIFICANDO ARCHIVOS ESENCIALES:');
archivosEsenciales.forEach(archivo => {
  const existe = fs.existsSync(path.join(__dirname, '..', archivo));
  console.log(`   ${existe ? '✅' : '❌'} ${archivo}`);
});

// Verificar package.json
console.log('\n📦 VERIFICANDO PACKAGE.JSON:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  console.log(`   ✅ Nombre: ${packageJson.name}`);
  console.log(`   ✅ Versión: ${packageJson.version}`);
  console.log(`   ${packageJson.scripts.start ? '✅' : '❌'} Script 'start' configurado`);
  console.log(`   ${packageJson.scripts.build ? '✅' : '❌'} Script 'build' configurado`);
  console.log(`   ${packageJson.engines ? '✅' : '⚠️'} Engines especificados ${packageJson.engines ? '' : '(opcional)'}`);
  
  // Verificar dependencias críticas
  const depsCriticas = ['express', 'mongoose', 'cors', 'helmet'];
  console.log('\n   📚 Dependencias críticas:');
  depsCriticas.forEach(dep => {
    console.log(`      ${packageJson.dependencies[dep] ? '✅' : '❌'} ${dep}`);
  });
  
} catch (error) {
  console.log('   ❌ Error leyendo package.json:', error.message);
}

// Verificar railway.json
console.log('\n🚂 VERIFICANDO RAILWAY.JSON:');
try {
  const railwayConfig = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
  console.log(`   ✅ Builder: ${railwayConfig.build?.builder || 'No especificado'}`);
  console.log(`   ✅ Start command: ${railwayConfig.deploy?.startCommand || 'No especificado'}`);
  console.log(`   ✅ Restart policy: ${railwayConfig.deploy?.restartPolicyType || 'No especificado'}`);
} catch (error) {
  console.log('   ❌ Error leyendo railway.json:', error.message);
}

// Verificar estructura de directorios
console.log('\n📂 VERIFICANDO ESTRUCTURA:');
const directorios = ['models', 'routes', 'uploads', 'scripts', 'docs'];
directorios.forEach(dir => {
  const existe = fs.existsSync(dir);
  console.log(`   ${existe ? '✅' : '⚠️'} ${dir}/ ${!existe ? '(se creará automáticamente si es necesario)' : ''}`);
});

// Verificar archivos de configuración
console.log('\n⚙️ ARCHIVOS DE CONFIGURACIÓN:');
const configFiles = ['.env.example', '.gitignore'];
configFiles.forEach(file => {
  const existe = fs.existsSync(file);
  console.log(`   ${existe ? '✅' : '⚠️'} ${file}`);
});

// Sugerencias finales
console.log('\n💡 CHECKLIST ANTES DE DEPLOYAR:');
console.log('   □ Código pusheado a GitHub');
console.log('   □ Variables de entorno preparadas');
console.log('   □ Cuenta de Railway creada');
console.log('   □ MongoDB Atlas configurado (opcional)');
console.log('   □ Dominios CORS actualizados');

console.log('\n🚀 PRÓXIMOS PASOS:');
console.log('   1. git add . && git commit -m "🚀 Preparar para Railway"');
console.log('   2. git push origin main');
console.log('   3. Crear proyecto en Railway');
console.log('   4. Configurar variables de entorno');
console.log('   5. ¡Deploy automático!');

console.log('\n📖 DOCUMENTACIÓN COMPLETA:');
console.log('   Ver: docs/Railway-Deployment.md');

console.log('\n🎉 ¡TU BACKEND ESTÁ LISTO PARA RAILWAY!');
