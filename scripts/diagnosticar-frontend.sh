#!/bin/bash

echo "🔍 DIAGNÓSTICO DE CONECTIVIDAD FRONTEND-BACKEND"
echo "=============================================="

echo ""
echo "📡 1. Probando servidor local (localhost):"
curl -s -o /dev/null -w "Status: %{http_code} | Tiempo: %{time_total}s\n" "http://localhost:3000/api/productos"

echo ""
echo "📱 2. Probando desde IP local (para dispositivos):"
IP_LOCAL=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "IP detectada: $IP_LOCAL"
curl -s -o /dev/null -w "Status: %{http_code} | Tiempo: %{time_total}s\n" "http://$IP_LOCAL:3000/api/productos"

echo ""
echo "🧪 3. Probando CORS con diferentes origins:"

# Probar con origin de React Native Metro
echo "Origin: http://localhost:8081"
curl -s -H "Origin: http://localhost:8081" -o /dev/null -w "Status: %{http_code}\n" "http://localhost:3000/api/productos"

# Probar con origin de Expo
echo "Origin: http://localhost:19006"
curl -s -H "Origin: http://localhost:19006" -o /dev/null -w "Status: %{http_code}\n" "http://localhost:3000/api/productos"

# Probar sin origin (null)
echo "Origin: null (apps móviles)"
curl -s -H "Origin: null" -o /dev/null -w "Status: %{http_code}\n" "http://localhost:3000/api/productos"

echo ""
echo "📊 4. Contando datos disponibles:"
PRODUCTOS_COUNT=$(curl -s "http://localhost:3000/api/productos" | grep -o '"_id"' | wc -l | tr -d ' ')
echo "Productos disponibles: $PRODUCTOS_COUNT"

echo ""
echo "🎯 5. URLs para tu frontend:"
echo "Localhost: http://localhost:3000/api/productos"
echo "IP local: http://$IP_LOCAL:3000/api/productos"
echo "Producción: https://hogarconectado-backend.onrender.com/api/productos"

echo ""
echo "✅ Diagnóstico completado"
