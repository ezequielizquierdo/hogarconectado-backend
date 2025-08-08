#!/bin/bash

# Script para diagnosticar timeout de categorías
echo "🔍 DIAGNÓSTICO DE TIMEOUT DE CATEGORÍAS"
echo "======================================"

# Función para medir tiempo de respuesta
measure_response() {
  local url=$1
  local name=$2
  echo "📊 Probando $name..."
  
  result=$(curl -w "Time: %{time_total}s | Status: %{http_code} | Size: %{size_download} bytes" -o /dev/null -s "$url")
  echo "   $result"
  echo ""
}

# URLs a probar
RENDER_URL="https://hogarconectado-backend.onrender.com"

echo "🌐 Probando endpoints en producción:"
measure_response "$RENDER_URL/health" "Health Check"
measure_response "$RENDER_URL/wake-up" "Wake Up"
measure_response "$RENDER_URL/api/categorias" "Categorías (1ra vez)"
measure_response "$RENDER_URL/api/categorias" "Categorías (2da vez - cache)"

echo "💡 Recomendaciones:"
echo "- Si Health Check responde rápido: el servidor está activo"
echo "- Si Wake Up falla (404): aún no se desplegaron las optimizaciones"
echo "- Si Categorías tarda >10s: implementar retry en la app"
echo "- La 2da llamada a categorías debería ser más rápida (cache)"

echo ""
echo "🚀 Para tu app móvil:"
echo "1. Aumentar timeout a 15-20 segundos"
echo "2. Implementar retry automático"
echo "3. Mostrar loading spinner"
echo "4. Llamar wake-up antes de cargar categorías"
