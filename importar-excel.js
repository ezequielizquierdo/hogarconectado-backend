const XLSX = require('xlsx');
const mongoose = require('mongoose');
const path = require('path');
const Categoria = require('./models/Categoria');
const Producto = require('./models/Producto');

// Mapeo de categorías del Excel a las categorías del sistema
const mapeoCategoriasExcel = {
  'AIRE ACONDICIONADO': 'Aire acondicionado',
  'ANAFE': 'Electrodomésticos de cocina',
  'ASPIRADORA': 'Aspiradoras',
  'ASADERAS': 'Asaderas, parrilleras y hornos de barro',
  'AUDIO': 'Equipos de audio',
  'BATERIAS DE COCINA': 'Baterías de cocina',
  'CAFETERA': 'Cafeteras',
  'CALEFACCION': 'Calefacción',
  'CELULAR': 'Celulares',
  'CUIDADO DEL CABELLO': 'Cuidado del cabello',
  'CUIDADO PERSONAL': 'Cuidado personal',
  'ELECTRODOMESTICOS': 'Electrodomésticos de cocina',
  'FITNESS': 'Fitnes',
  'FREEZER': 'Freezers',
  'HELADERA': 'Heladeras',
  'HERRAMIENTAS': 'Herramientas',
  'HOGAR': 'Hogar',
  'ILUMINACION': 'Iluminación',
  'INFORMATICA': 'Informática',
  'JARDIN': 'Jardinería',
  'LAVARROPAS': 'Lavarropas',
  'MICROONDAS': 'Microondas',
  'SECARROPAS': 'Secarropas',
  'SMART TV': 'Smart TV',
  'SMARTPHONE': 'Smartphones',
  'TABLET': 'Tablets',
  'TERMOTANQUE': 'Termotanques',
  'VENTILACION': 'Ventilación'
};

// Categorías que deben existir en el sistema
const categoriasBase = [
  { nombre: 'Aire acondicionado', descripcion: 'Equipos de climatización y refrigeración', icono: 'air' },
  { nombre: 'Aspiradoras', descripcion: 'Aspiradoras y equipos de limpieza', icono: 'vacuum' },
  { nombre: 'Asaderas, parrilleras y hornos de barro', descripcion: 'Equipos para asados y parrillas', icono: 'grill' },
  { nombre: 'Baterías de cocina', descripcion: 'Ollas, sartenes y utensilios de cocina', icono: 'cookware' },
  { nombre: 'Cafeteras', descripcion: 'Máquinas de café y accesorios', icono: 'coffee' },
  { nombre: 'Calefacción', descripcion: 'Sistemas de calefacción y estufas', icono: 'heat' },
  { nombre: 'Celulares', descripcion: 'Teléfonos móviles y smartphones', icono: 'phone' },
  { nombre: 'Cuidado del cabello', descripcion: 'Secadores, planchas y productos para el cabello', icono: 'hair' },
  { nombre: 'Cuidado personal', descripcion: 'Productos de higiene y belleza', icono: 'personal' },
  { nombre: 'Electrodomésticos de cocina', descripcion: 'Equipos eléctricos para cocina', icono: 'kitchen' },
  { nombre: 'Equipos de audio', descripcion: 'Parlantes, auriculares y sistemas de sonido', icono: 'audio' },
  { nombre: 'Fitnes', descripcion: 'Equipos de ejercicio y fitness', icono: 'fitness' },
  { nombre: 'Freezers', descripcion: 'Congeladores y freezers', icono: 'freezer' },
  { nombre: 'Heladeras', descripcion: 'Refrigeradores y heladeras', icono: 'fridge' },
  { nombre: 'Herramientas', descripcion: 'Herramientas manuales y eléctricas', icono: 'tools' },
  { nombre: 'Hogar', descripcion: 'Artículos generales para el hogar', icono: 'home' },
  { nombre: 'Iluminación', descripcion: 'Lámparas y sistemas de iluminación', icono: 'light' },
  { nombre: 'Informática', descripcion: 'Computadoras y equipos informáticos', icono: 'computer' },
  { nombre: 'Jardinería', descripcion: 'Herramientas y equipos para jardín', icono: 'garden' },
  { nombre: 'Lavarropas', descripcion: 'Máquinas lavadoras', icono: 'washing' },
  { nombre: 'Microondas', descripcion: 'Hornos microondas', icono: 'microwave' },
  { nombre: 'Secarropas', descripcion: 'Máquinas secadoras', icono: 'dryer' },
  { nombre: 'Smart TV', descripcion: 'Televisores inteligentes', icono: 'tv' },
  { nombre: 'Smartphones', descripcion: 'Teléfonos inteligentes', icono: 'smartphone' },
  { nombre: 'Tablets', descripcion: 'Tabletas y dispositivos móviles', icono: 'tablet' },
  { nombre: 'Termotanques', descripcion: 'Calentadores de agua', icono: 'water-heater' },
  { nombre: 'Ventilación', descripcion: 'Ventiladores y sistemas de ventilación', icono: 'fan' }
];

function limpiarTexto(texto) {
  if (!texto) return '';
  return String(texto).trim().replace(/\s+/g, ' ');
}

function procesarNumero(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') {
    // Remover caracteres no numéricos excepto punto y coma
    const numero = valor.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(numero) || 0;
  }
  return 0;
}

async function importarDesdeExcel() {
  try {
    console.log('📊 INICIANDO IMPORTACIÓN DESDE EXCEL...');
    console.log('=' .repeat(50));
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hogarconectado');
    console.log('✅ Conectado a MongoDB');
    
    // Leer archivo Excel
    const excelPath = path.join(__dirname, 'stock.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets['Hoja1'];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`📋 Total de filas encontradas: ${data.length}`);
    
    // Eliminar datos existentes
    console.log('🧹 Limpiando datos existentes...');
    await Categoria.deleteMany({});
    await Producto.deleteMany({});
    
    // Insertar categorías base
    console.log('📦 Insertando categorías base...');
    const categoriasInsertadas = await Categoria.insertMany(categoriasBase);
    console.log(`✅ ${categoriasInsertadas.length} categorías insertadas`);
    
    // Crear mapeo de categorías por nombre
    const categoriaMap = {};
    categoriasInsertadas.forEach(cat => {
      categoriaMap[cat.nombre] = cat._id;
    });
    
    // Procesar productos desde Excel
    const productos = [];
    const errores = [];
    let productosValidos = 0;
    
    // Empezar desde la fila 2 (índice 1) para saltar headers
    for (let i = 1; i < data.length; i++) {
      const fila = data[i];
      
      try {
        // Extraer datos de las columnas según el análisis
        const categoriaExcel = limpiarTexto(fila[0]); // CATEGORIA
        const marca = limpiarTexto(fila[1]); // MARCA  
        const modelo = limpiarTexto(fila[2]); // MODELO
        const detalle = limpiarTexto(fila[3]); // DETALLE
        const color = limpiarTexto(fila[4]); // COLOR
        const valorPablo = procesarNumero(fila[6]); // VALOR PABLO (precio base)
        const stock = procesarNumero(fila[24]); // STOCK
        
        // Validaciones básicas
        if (!categoriaExcel || !marca || !modelo || valorPablo <= 0) {
          errores.push(`Fila ${i + 1}: Datos incompletos o inválidos`);
          continue;
        }
        
        // Mapear categoría del Excel a categoría del sistema
        const categoriaSistema = mapeoCategoriasExcel[categoriaExcel.toUpperCase()] || 'Hogar';
        const categoriaId = categoriaMap[categoriaSistema];
        
        if (!categoriaId) {
          errores.push(`Fila ${i + 1}: Categoría '${categoriaSistema}' no encontrada`);
          continue;
        }
        
        // Crear descripción combinada
        let descripcion = modelo;
        if (detalle) descripcion += ` - ${detalle}`;
        if (color) descripcion += ` - ${color}`;
        
        // Crear especificaciones
        const especificaciones = {};
        if (color) especificaciones.color = color;
        if (detalle) especificaciones.detalles = detalle;
        
        // Crear tags para búsqueda
        const tags = [
          marca.toLowerCase(),
          modelo.toLowerCase().split(' '),
          categoriaExcel.toLowerCase().replace(/\s+/g, '-')
        ].flat().filter(Boolean);
        
        const producto = {
          categoria: categoriaId,
          marca: marca,
          modelo: modelo,
          descripcion: descripcion,
          precioBase: valorPablo,
          especificaciones: especificaciones,
          stock: {
            cantidad: stock || 0,
            disponible: stock > 0
          },
          tags: tags,
          activo: true
        };
        
        productos.push(producto);
        productosValidos++;
        
        // Log de progreso cada 50 productos
        if (productosValidos % 50 === 0) {
          console.log(`📦 Procesados ${productosValidos} productos...`);
        }
        
      } catch (error) {
        errores.push(`Fila ${i + 1}: Error al procesar - ${error.message}`);
      }
    }
    
    // Insertar productos en la base de datos
    if (productos.length > 0) {
      console.log(`💾 Insertando ${productos.length} productos en la base de datos...`);
      const productosInsertados = await Producto.insertMany(productos);
      console.log(`✅ ${productosInsertados.length} productos insertados exitosamente`);
    }
    
    // Mostrar resumen
    console.log('\n🎉 IMPORTACIÓN COMPLETADA!');
    console.log('=' .repeat(50));
    console.log(`📊 RESUMEN:`);
    console.log(`   • Total de filas procesadas: ${data.length - 1}`);
    console.log(`   • Productos válidos: ${productosValidos}`);
    console.log(`   • Productos insertados: ${productos.length}`);
    console.log(`   • Errores encontrados: ${errores.length}`);
    console.log(`   • Categorías disponibles: ${categoriasInsertadas.length}`);
    
    if (errores.length > 0 && errores.length <= 10) {
      console.log('\n⚠️  ERRORES ENCONTRADOS:');
      errores.forEach(error => console.log(`   • ${error}`));
    } else if (errores.length > 10) {
      console.log(`\n⚠️  ${errores.length} errores encontrados (mostrando primeros 10):`);
      errores.slice(0, 10).forEach(error => console.log(`   • ${error}`));
    }
    
    // Mostrar estadísticas por categoría
    console.log('\n📈 PRODUCTOS POR CATEGORÍA:');
    const estadisticas = await Producto.aggregate([
      { $match: { activo: true } },
      { 
        $lookup: {
          from: 'categorias',
          localField: 'categoria',
          foreignField: '_id',
          as: 'categoriaInfo'
        }
      },
      { $unwind: '$categoriaInfo' },
      {
        $group: {
          _id: '$categoriaInfo.nombre',
          cantidad: { $sum: 1 },
          precioPromedio: { $avg: '$precioBase' }
        }
      },
      { $sort: { cantidad: -1 } }
    ]);
    
    estadisticas.forEach(stat => {
      console.log(`   • ${stat._id}: ${stat.cantidad} productos (Precio promedio: $${Math.round(stat.precioPromedio).toLocaleString()})`);
    });
    
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Conexión a base de datos cerrada');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  importarDesdeExcel();
}

module.exports = { importarDesdeExcel };
