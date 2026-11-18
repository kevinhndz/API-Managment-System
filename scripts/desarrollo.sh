#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -x venv/bin/python ]]; then
  echo "Falta venv. Ejecuta: python3 -m venv venv && venv/bin/python -m pip install -r backend/requirements-dev.txt" >&2
  exit 1
fi
if [[ ! -f .env ]]; then
  echo "Falta .env. Copia .env.example y configura PostgreSQL y SECRET_KEY." >&2
  exit 1
fi
if [[ ! -d frontend/node_modules ]]; then
  echo "Faltan dependencias del frontend. Ejecuta: cd frontend && npm ci" >&2
  exit 1
fi

venv/bin/python -m uvicorn main:app --app-dir backend --reload-dir backend --reload --host 127.0.0.1 --port 8000 &
backend_pid=$!
limpiar() {
  kill "$backend_pid" 2>/dev/null || true
  wait "$backend_pid" 2>/dev/null || true
}
trap limpiar EXIT INT TERM
sleep 2
if ! kill -0 "$backend_pid" 2>/dev/null; then
  echo "El backend no pudo iniciar. Revisa DATABASE_URL y el puerto 8000." >&2
  exit 1
fi
npm --prefix frontend run dev -- --host 127.0.0.1 --strictPort
