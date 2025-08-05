const mongoose = require('mongoose');

async function ejemplosPaginacion() {
  console.log('=== EJEMPLOS DE PAGINACIÓN PARA FRONTEND ===\n');
  
  console.log('🎯 CASOS DE USO COMUNES:\n');
  
  // Ejemplo 1: Paginación básica
  console.log('1️⃣ PAGINACIÓN BÁSICA:');
  console.log('   Primera página (20 productos por defecto):');
  console.log('   GET /api/productos?pagina=1');
  console.log('   ✅ Respuesta: datos + información de navegación\n');
  
  console.log('   Segunda página:');
  console.log('   GET /api/productos?pagina=2');
  console.log('   ✅ Respuesta: productos 21-40 + navegación\n');
  
  // Ejemplo 2: Diferentes tamaños de página
  console.log('2️⃣ DIFERENTES TAMAÑOS DE PÁGINA:');
  console.log('   Mostrar 10 productos por página:');
  console.log('   GET /api/productos?pagina=1&limite=10');
  console.log('   ✅ Total páginas: 13 (130 productos ÷ 10)\n');
  
  console.log('   Mostrar 50 productos por página:');
  console.log('   GET /api/productos?pagina=1&limite=50');
  console.log('   ✅ Total páginas: 3 (130 productos ÷ 50)\n');
  
  // Ejemplo 3: Navegación con filtros
  console.log('3️⃣ NAVEGACIÓN CON FILTROS:');
  console.log('   Búsqueda paginada:');
  console.log('   GET /api/productos?buscar=samsung&pagina=1&limite=10');
  console.log('   ✅ Solo productos Samsung con paginación\n');
  
  console.log('   Filtro por categoría:');
  console.log('   GET /api/productos?categoria=CATEGORIA_ID&pagina=1');
  console.log('   ✅ Solo productos de esa categoría paginados\n');
  
  // Ejemplo 4: Ordenamiento
  console.log('4️⃣ ORDENAMIENTO PAGINADO:');
  console.log('   Por precio (menor a mayor):');
  console.log('   GET /api/productos?ordenar=precio-asc&pagina=1');
  console.log('   ✅ Productos ordenados por precio + paginación\n');
  
  console.log('   Alfabético:');
  console.log('   GET /api/productos?ordenar=alfabetico&pagina=1');
  console.log('   ✅ Productos A-Z + paginación\n');
  
  // Información de respuesta
  console.log('📤 INFORMACIÓN EN LA RESPUESTA:');
  console.log(`{
  "success": true,
  "data": [...], // Array de productos
  "pagination": {
    "pagina": 1,                    // Página actual
    "limite": 20,                   // Productos por página
    "total": 130,                   // Total de productos
    "totalPaginas": 7,              // Total de páginas
    "tienePaginaAnterior": false,   // ¿Hay página anterior?
    "tienePaginaSiguiente": true,   // ¿Hay página siguiente?
    "paginaAnterior": null,         // Número de página anterior
    "paginaSiguiente": 2,           // Número de página siguiente
    "desde": 1,                     // Producto inicial mostrado
    "hasta": 20                     // Producto final mostrado
  },
  "filtros": {                      // Filtros aplicados
    "categoria": null,
    "marca": null,
    "disponible": "true",
    "buscar": null,
    "ordenar": "recientes"
  }
}\n`);
  
  console.log('🎨 IMPLEMENTACIÓN EN FRONTEND:\n');
  
  console.log('📱 COMPONENTE DE PAGINACIÓN:');
  console.log(`function Paginacion({ pagination, onPageChange }) {
  return (
    <div className="pagination">
      {/* Botón Anterior */}
      {pagination.tienePaginaAnterior && (
        <button onClick={() => onPageChange(pagination.paginaAnterior)}>
          ← Anterior
        </button>
      )}
      
      {/* Información de página */}
      <span>
        Página {pagination.pagina} de {pagination.totalPaginas}
        (Mostrando {pagination.desde}-{pagination.hasta} de {pagination.total})
      </span>
      
      {/* Botón Siguiente */}
      {pagination.tienePaginaSiguiente && (
        <button onClick={() => onPageChange(pagination.paginaSiguiente)}>
          Siguiente →
        </button>
      )}
    </div>
  );
}\n`);
  
  console.log('🔄 FUNCIÓN DE NAVEGACIÓN:');
  console.log(`function manejarCambioPagina(nuevaPagina, filtros = {}) {
  const params = new URLSearchParams({
    pagina: nuevaPagina,
    limite: 20,
    ...filtros
  });
  
  fetch(\`/api/productos?\${params}\`)
    .then(response => response.json())
    .then(data => {
      // Actualizar productos mostrados
      setProductos(data.data);
      // Actualizar información de paginación
      setPaginacion(data.pagination);
    });
}\n`);
  
  console.log('🎯 SELECTOR DE PRODUCTOS POR PÁGINA:');
  console.log(`<select onChange={(e) => cambiarLimite(e.target.value)}>
  <option value="10">10 por página</option>
  <option value="20" selected>20 por página</option>
  <option value="50">50 por página</option>
</select>\n`);
  
  console.log('✅ VENTAJAS DE ESTA IMPLEMENTACIÓN:');
  console.log('   • ⚡ Rendimiento optimizado (máximo 20 productos por defecto)');
  console.log('   • 🧭 Navegación completa (anterior/siguiente/total)');
  console.log('   • 🔍 Compatible con filtros y búsquedas');
  console.log('   • 📱 Frontend-friendly con toda la metadata necesaria');
  console.log('   • 🛡️ Validación de parámetros (límites máximos)');
  console.log('   • 📊 Información de rango (desde/hasta productos)');
  
  console.log('\n🎉 ¡PAGINACIÓN LISTA PARA USAR EN TU FRONTEND!');
}

ejemplosPaginacion();
