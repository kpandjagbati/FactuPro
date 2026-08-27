#!/usr/bin/env bash
# FactuPro — Apache Bench
# Ordre : 1) ab local  2) Docker httpd  3) fallback Node
#
# IMPORTANT : Apache Bench envoie HTTP/1.0.
# Vercel (HTTPS prod) répond souvent 403 → utiliser ab sur localhost HTTP,
# et k6 pour la prod HTTPS.
#
# Usage:
#   bash load-tests/ab/run-ab.sh http://localhost:3000
#   bash load-tests/ab/run-ab.sh https://factu-pro-theta.vercel.app   # déconseillé

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BASE_URL="${1:-http://localhost:3000}"
BASE_URL="${BASE_URL%/}"
N="${AB_N:-50}"
C="${AB_C:-5}"

AB_FLAGS=(
  -n "$N"
  -c "$C"
  -l
  -H "User-Agent: Mozilla/5.0 (compatible; FactuPro-AB/1.0)"
  -H "Accept: text/html"
)

if [[ "$BASE_URL" == https://* ]]; then
  AB_FLAGS+=(-f TLS1.2)
  echo "⚠  Cible HTTPS détectée."
  echo "   Apache Bench utilise HTTP/1.0 → Vercel renvoie souvent 403."
  echo "   Pour des résultats fiables :"
  echo "     1) npm run dev   puis   bash load-tests/ab/run-ab.sh http://localhost:3000"
  echo "     2) ou npm run load:k6:smoke  (recommandé pour la prod)"
  echo
fi

echo "========================================"
echo " Apache Bench — FactuPro"
echo " Target : $BASE_URL"
echo " -n $N  -c $C"
echo "========================================"
echo

run_paths() {
  local runner=("$@")
  for path in "/" "/sign-in" "/sign-up"; do
    echo ">>> $path"
    "${runner[@]}" "${AB_FLAGS[@]}" "${BASE_URL}${path}" || true
    echo
  done
}

if command -v ab >/dev/null 2>&1; then
  echo "Mode: ab local"
  run_paths ab
elif docker info >/dev/null 2>&1; then
  echo "Mode: Docker (httpd:2.4-alpine)"
  run_paths docker run --rm httpd:2.4-alpine ab
else
  echo "ab / Docker indisponibles → fallback Node"
  AB_N="$N" AB_C="$C" node "$ROOT/load-tests/ab/run-ab-node.mjs" "$BASE_URL"
fi

echo "Terminé. Regarde :"
echo "  - Requests per second"
echo "  - Time per request (mean)"
echo "  - Failed requests / Non-2xx (idéal : 0)"
