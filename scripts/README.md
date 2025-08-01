# 🛠️ Scripts de Utilidad

Esta carpeta contiene scripts auxiliares para el mantenimiento y administración del backend.

## 📋 Scripts Disponibles

### 🗃️ Gestión de Base de Datos
- **`verificar-bd.js`** - Diagnóstico completo de la base de datos
- **`diagnostico-final.js`** - Debug completo del API y conexiones
- **`actualizar-stock.js`** - Actualiza campos de stock en productos existentes

### 🏷️ Gestión de Categorías
- **`gestionar-categorias.js`** - Administrar categorías (crear, listar)
- **`agregar-lavavajillas.js`** - Script específico para agregar categoría Lavavajillas
- **`arreglar-categorias.js`** - Reparar referencias rotas de categorías

### 🐛 Debugging y Diagnóstico
- **`debug-productos.js`** - Debug específico para problemas con productos
- **`check-stock.js`** - Verificar estructura de campos de stock

## 🚀 Cómo usar los scripts

```bash
# Desde la raíz del proyecto

# Verificar estado de la BD
node scripts/verificar-bd.js

# Gestionar categorías
node scripts/gestionar-categorias.js listar
node scripts/gestionar-categorias.js agregar "Nombre" "Descripción" "🔥"

# Actualizar productos sin stock
node scripts/actualizar-stock.js

# Diagnosticar problemas del API
node scripts/diagnostico-final.js
```

## ⚠️ Importante

- Estos scripts se conectan directamente a MongoDB
- Asegúrate de que MongoDB esté ejecutándose antes de usar los scripts
- Algunos scripts modifican datos, úsalos con precaución en producción
- Siempre haz backup antes de ejecutar scripts que modifiquen datos
