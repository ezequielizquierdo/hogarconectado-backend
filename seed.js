const mongoose = require('mongoose');
const Categoria = require('./models/Categoria');
const Producto = require('./models/Producto');

// Categorías basadas en el dropdown del frontend
const categorias = [
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

// Productos de ejemplo
const productos = [
  // Aires acondicionados
  {
    categoria: 'Aire acondicionado',
    marca: 'BGH',
    modelo: 'Silent Air 3000 Frío/Calor',
    descripcion: 'Aire acondicionado split 3000 frigorías con función calor',
    precioBase: 850000,
    especificaciones: {
      frigorias: 3000,
      tipo: 'Split',
      funcion: 'Frío/Calor',
      eficiencia: 'A',
      garantia: '2 años'
    },
    tags: ['split', 'frio-calor', 'bgh', 'eficiente']
  },
  {
    categoria: 'Aire acondicionado',
    marca: 'Surrey',
    modelo: 'Eco Inverter 2250',
    descripcion: 'Aire acondicionado inverter 2250 frigorías bajo consumo',
    precioBase: 720000,
    especificaciones: {
      frigorias: 2250,
      tipo: 'Split Inverter',
      funcion: 'Solo Frío',
      eficiencia: 'A++',
      garantia: '3 años'
    },
    tags: ['inverter', 'solo-frio', 'surrey', 'bajo-consumo']
  },

  // Smart TVs
  {
    categoria: 'Smart TV',
    marca: 'Samsung',
    modelo: '65" QLED 4K Q70C',
    descripcion: 'Smart TV Samsung QLED 65 pulgadas 4K con HDR',
    precioBase: 1200000,
    especificaciones: {
      pulgadas: 65,
      resolucion: '4K UHD',
      tecnologia: 'QLED',
      smart: 'Tizen OS',
      hdr: 'HDR10+',
      garantia: '1 año'
    },
    tags: ['qled', '4k', 'samsung', 'smart-tv', 'hdr']
  },
  {
    categoria: 'Smart TV',
    marca: 'LG',
    modelo: '55" OLED C3',
    descripcion: 'Smart TV LG OLED 55 pulgadas con procesador α9 Gen6',
    precioBase: 1800000,
    especificaciones: {
      pulgadas: 55,
      resolucion: '4K UHD',
      tecnologia: 'OLED',
      smart: 'webOS',
      procesador: 'α9 Gen6',
      garantia: '2 años'
    },
    tags: ['oled', '4k', 'lg', 'webos', 'premium']
  },

  // Heladeras
  {
    categoria: 'Heladeras',
    marca: 'Whirlpool',
    modelo: 'WRM56D No Frost 520L',
    descripcion: 'Heladera No Frost 520 litros con dispensador de agua',
    precioBase: 950000,
    especificaciones: {
      capacidad: '520L',
      tipo: 'No Frost',
      puertas: 2,
      dispensador: 'Agua',
      eficiencia: 'A',
      garantia: '2 años'
    },
    tags: ['no-frost', 'whirlpool', 'dispensador', 'eficiente']
  },

  // Lavarropas
  {
    categoria: 'Lavarropas',
    marca: 'Drean',
    modelo: 'Next 8.12 Eco',
    descripcion: 'Lavarropas automático 8kg con 12 programas',
    precioBase: 650000,
    especificaciones: {
      capacidad: '8kg',
      programas: 12,
      tipo: 'Automático',
      eficiencia: 'A+',
      garantia: '2 años'
    },
    tags: ['automatico', 'drean', '8kg', 'eco']
  },

  // Microondas
  {
    categoria: 'Microondas',
    marca: 'Panasonic',
    modelo: 'NN-ST65L',
    descripcion: 'Microondas 32L con grill y 10 niveles de potencia',
    precioBase: 280000,
    especificaciones: {
      capacidad: '32L',
      potencia: '900W',
      grill: true,
      niveles: 10,
      garantia: '1 año'
    },
    tags: ['grill', 'panasonic', '32l', 'potente']
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seeding de la base de datos...');

    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hogarconectado');
    console.log('✅ Conectado a MongoDB');

    // Limpiar datos existentes
    await Categoria.deleteMany({});
    await Producto.deleteMany({});
    console.log('🧹 Datos anteriores eliminados');

    // Insertar categorías
    const categoriasInsertadas = await Categoria.insertMany(categorias);
    console.log(`✅ ${categoriasInsertadas.length} categorías insertadas`);

    // Mapear categorías por nombre para obtener los IDs
    const categoriaMap = {};
    categoriasInsertadas.forEach(cat => {
      categoriaMap[cat.nombre] = cat._id;
    });

    // Insertar productos con referencias a categorías
    const productosConReferencias = productos.map(producto => ({
      ...producto,
      categoria: categoriaMap[producto.categoria]
    }));

    const productosInsertados = await Producto.insertMany(productosConReferencias);
    console.log(`✅ ${productosInsertados.length} productos insertados`);

    console.log('🎉 Seeding completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   • Categorías: ${categoriasInsertadas.length}`);
    console.log(`   • Productos: ${productosInsertados.length}`);

  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Conexión cerrada');
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, categorias, productos };
