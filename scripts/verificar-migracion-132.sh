#!/bin/bash

echo "🔍 VERIFICANDO MIGRACIÓN DE 132 PRODUCTOS"
echo "========================================"

echo "📊 Contando productos en API..."
PRODUCTOS_API=$(curl -s "https://hogarconectado-backend.onrender.com/api/productos" | grep -o '"_id"' | wc -l | tr -d ' ')

echo "📦 Productos en API de producción: $PRODUCTOS_API"

if [ "$PRODUCTOS_API" -eq 132 ]; then
    echo "✅ ¡MIGRACIÓN EXITOSA! Todos los 132 productos están en producción"
elif [ "$PRODUCTOS_API" -gt 7 ]; then
    echo "🔄 Migración parcial: $PRODUCTOS_API productos (esperados: 132)"
else
    echo "❌ Migración incompleta: solo $PRODUCTOS_API productos"
fi

echo ""
echo "🧪 Probando paginación con productos migrados:"
curl -s "https://hogarconectado-backend.onrender.com/api/productos?pagina=1&limite=5" | jq '.pagination' 2>/dev/null || echo "Datos recibidos (sin jq)"

echo ""
echo "✅ Verificación completada"
