const XLSX = require('xlsx');
const path = require('path');

// Función para analizar la estructura del Excel
function analizarExcel() {
  try {
    console.log('📊 ANALIZANDO ARCHIVO EXCEL...');
    console.log('=' .repeat(50));
    
    // Leer el archivo Excel
    const excelPath = path.join(__dirname, 'stock.xlsx');
    const workbook = XLSX.readFile(excelPath);
    
    console.log('📋 Hojas disponibles:', workbook.SheetNames);
    
    // Analizar cada hoja
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`\n📑 HOJA ${index + 1}: "${sheetName}"`);
      console.log('-' .repeat(30));
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log(`📏 Total de filas: ${data.length}`);
      
      if (data.length > 0) {
        console.log('🏷️  Columnas (primera fila):');
        data[0].forEach((header, colIndex) => {
          console.log(`   ${colIndex + 1}. ${header || '(vacía)'}`);
        });
        
        // Mostrar primeras 3 filas de datos como ejemplo
        console.log('\n🔍 Primeras filas de ejemplo:');
        for (let i = 0; i < Math.min(4, data.length); i++) {
          console.log(`   Fila ${i + 1}:`, data[i]);
        }
      }
    });
    
    return workbook;
    
  } catch (error) {
    console.error('❌ Error leyendo Excel:', error.message);
    return null;
  }
}

// Ejecutar análisis
if (require.main === module) {
  analizarExcel();
}

module.exports = { analizarExcel };
