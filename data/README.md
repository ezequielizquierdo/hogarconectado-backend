# 📊 Datos y Scripts de Importación

Esta carpeta contiene archivos de datos y scripts para importar información al sistema.

## 📁 Archivos

### 📈 Datos de Productos
- **`stock.xlsx`** - Archivo Excel con inventario de productos
  - Contiene: marca, modelo, precio, categoría
  - 80+ productos de electrodomésticos

### 🔄 Scripts de Importación
- **`importar-excel.js`** - Importa productos desde `stock.xlsx` a MongoDB
- **`analizar-excel.js`** - Analiza estructura del archivo Excel antes de importar

## 🚀 Uso

### Importar productos desde Excel:
```bash
# Desde la raíz del proyecto
node data/importar-excel.js

# O usando npm script
npm run import-excel
```

### Analizar archivo Excel:
```bash
node data/analizar-excel.js
```

## 📋 Estructura del Excel

El archivo `stock.xlsx` debe tener las siguientes columnas:
- **MARCA**: Marca del producto
- **MODELO**: Modelo específico 
- **PRECIO**: Precio base del producto
- **CATEGORÍA**: Categoría del producto (se mapea automáticamente)

## ⚠️ Notas

- El script de importación crea automáticamente categorías si no existen
- Los productos duplicados se omiten
- Se generan tags automáticamente basados en marca y modelo
- El campo `activo` se establece en `true` por defecto
