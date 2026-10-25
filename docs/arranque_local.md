# Arranque local de CampusFlow

Requisitos: Python 3.14, Node.js 22, npm y una base PostgreSQL accesible.

1. Crea el entorno: `python3 -m venv venv`.
2. Instala Python: `venv/bin/python -m pip install -r requirements-dev.txt`.
3. Instala el frontend: `cd frontend && npm ci`.
4. Crea `.env` desde `.env.example`. Pon tu URL real de PostgreSQL en `DATABASE_URL` y genera `SECRET_KEY` con `python3 -c 'import secrets; print(secrets.token_urlsafe(48))'`.
5. Comprueba migraciones: `venv/bin/alembic current`. Si esta detras del head, ejecuta `venv/bin/alembic upgrade head` despues de respaldar la base.
6. Desde la raiz ejecuta `npm run dev`. Abre `http://localhost:5173`; el backend escucha en `http://127.0.0.1:8000`.

`npm run dev` inicia ambos servicios y los detiene al pulsar Ctrl+C. Para usarlos en dos terminales, ejecuta `npm run dev:backend` y `npm run dev:frontend` por separado desde la raiz.

El arranque academico usa PostgreSQL. El registro de universidades con pago requiere ademas las variables de Paddle Sandbox y un webhook publico firmado. Consulta `deploy/PADDLE_SANDBOX.md` antes del despliegue.
