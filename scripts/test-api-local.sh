#!/usr/bin/env bash

set -euo pipefail

api_base_url="${API_BASE_URL:-http://localhost:3000}"

check_endpoint() {
  local label="$1"
  local path="$2"
  local status

  status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "${api_base_url}${path}")"
  if [[ "$status" != "200" ]]; then
    echo "ERROR: ${label} respondió HTTP ${status}"
    return 1
  fi

  echo "OK: ${label}"
}

echo "Verificando API en ${api_base_url}"
check_endpoint "información de la API" "/"
check_endpoint "estado del servicio" "/health"
check_endpoint "categorías públicas" "/api/categorias?limite=3"
check_endpoint "productos públicos" "/api/productos?limite=2"

echo "La API pública respondió correctamente."
