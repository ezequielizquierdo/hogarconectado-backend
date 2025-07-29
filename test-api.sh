#!/bin/bash

echo "🧪 Probando API de Hogar Conectado..."
echo "======================================"

# Probar endpoint principal
echo "1. Probando endpoint principal:"
curl -s http://localhost:3000 | jq .
echo ""

# Probar categorías
echo "2. Probando categorías (primeras 3):"
curl -s "http://localhost:3000/api/categorias?limite=3" | jq .
echo ""

# Probar productos
echo "3. Probando productos (primeros 2):"
curl -s "http://localhost:3000/api/productos?limite=2" | jq .
echo ""

# Obtener ID de un producto para cotizar
PRODUCTO_ID=$(curl -s "http://localhost:3000/api/productos?limite=1" | jq -r '.data[0]._id')
echo "4. Probando cotización del producto ID: $PRODUCTO_ID"
curl -s "http://localhost:3000/api/productos/$PRODUCTO_ID/cotizar" | jq .
echo ""

echo "✅ Pruebas completadas!"
