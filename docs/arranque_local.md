# Arranque local de CampusFlow

Requisitos: Python 3.14, Node.js 22, npm y una base PostgreSQL accesible.

## Con Docker Compose

El `deploy/compose.yaml` levanta dos servicios: `api` construida con `backend/Dockerfile`, y `frontend` construida con `frontend/Dockerfile`. El contenedor del frontend compila React y entrega los archivos estaticos con un servidor sencillo; no agrega otro Nginx. Ambos servicios se conectan a `red-saas`. En el VPS, el Nginx compartido tambien se conecta a esa red y recibe el trafico publico.

1. Configura el archivo `.env` de la raiz con `DATABASE_URL` y `SECRET_KEY` validos. Compose usa esos valores para el backend.
2. Construye y arranca los dos servicios desde la raiz:

   ```bash
   docker compose -f deploy/compose.yaml up --build -d
   ```

3. Abre `http://localhost:8080`. Para comprobar la API, abre `http://localhost:8000/docs` o ejecuta `curl -i http://localhost:8000/health`.
4. Consulta estado y logs con `docker compose -f deploy/compose.yaml ps` y `docker compose -f deploy/compose.yaml logs -f`.
5. Deten los servicios con `docker compose -f deploy/compose.yaml down`. Los archivos subidos permanecen en el volumen `uploads`. Se conserva el nombre de proyecto `sistemaapi` para reutilizar el volumen local existente.

El servicio API publica `127.0.0.1:8000` para que el navegador pueda consultarla directamente. El frontend esta en `127.0.0.1:8080`; esta configuracion es solo para desarrollo local. En el VPS, el Nginx compartido dirige `/` al frontend y `/api/` y `/uploads/` a la API.

## Arranque sin Docker

1. Crea el entorno: `python3 -m venv venv`.
2. Instala Python: `venv/bin/python -m pip install -r backend/requirements-dev.txt`.
3. Instala el frontend: `cd frontend && npm ci`.
4. Crea `.env` desde `.env.example`. Pon tu URL real de PostgreSQL en `DATABASE_URL` y genera `SECRET_KEY` con `python3 -c 'import secrets; print(secrets.token_urlsafe(48))'`.
5. Comprueba migraciones: `venv/bin/python -m alembic -c backend/alembic.ini current`. Si esta detras del head, ejecuta `venv/bin/python -m alembic -c backend/alembic.ini upgrade head` despues de respaldar la base.
6. Desde la raiz ejecuta `npm run dev`. Abre `http://localhost:5173`; el backend escucha en `http://127.0.0.1:8000`.

`npm run dev` inicia ambos servicios y los detiene al pulsar Ctrl+C. Para usarlos en dos terminales, ejecuta `npm run dev:backend` y `npm run dev:frontend` por separado desde la raiz.

El arranque academico usa PostgreSQL. El registro de universidades con pago requiere ademas las variables de Paddle Sandbox y un webhook publico firmado. Consulta `deploy/PADDLE_SANDBOX.md` antes del despliegue.

## Enviar enlaces de recuperacion

El boton de Configuracion necesita un correo guardado en el perfil y un proveedor
SMTP configurado en el `.env` de la raiz. Completa estos valores con los datos
del proveedor; no subas las credenciales a Git:

```dotenv
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_USER=tu-usuario-smtp
SMTP_PASSWORD=tu-clave-smtp
SMTP_FROM=cuenta-autorizada@tu-dominio.com
SMTP_STARTTLS=true
```

El transporte actual usa STARTTLS (normalmente puerto 587); no usa TLS implicito
del puerto 465. Configura `FRONTEND_ORIGINS` con la URL local del frontend como
primer origen, por ejemplo `http://localhost:5173,http://127.0.0.1:5173`, para que
el correo enlace a esta copia. Reinicia `npm run dev` despues de editar `.env`.

Guarda primero los cambios del correo en Configuracion y luego pulsa **Enviar
enlace**. El resultado aparece junto al boton. Sin SMTP la API responde 503;
con SMTP disponible conserva una respuesta generica para evitar revelar si una
cuenta existe. La confirmacion HTTP no demuestra entrega en la bandeja: comprueba
el correo real y abre `/restablecer-contrasena?token=...`. El enlace vence en
30 minutos y solo puede usarse una vez.

## Organizacion y comandos desde la raiz

El codigo Python, sus pruebas y migraciones estan en `backend/`. React permanece en
`frontend/`; Docker Compose y las instrucciones de despliegue estan en `deploy/`.
El `.env`, `venv/` y `uploads/` permanecen en la raiz. Los comandos locales se
lanzan desde la raiz para conservar esas ubicaciones. El contenedor mantiene
`/app` y su volumen `/app/uploads` como antes.

```bash
npm run test:backend
npm run db:current
npm run docker:up
npm run docker:down
```

Para ejecutar las utilidades Python de `scripts/`, agrega el backend al path:

```bash
PYTHONPATH=backend venv/bin/python scripts/crear_institucion.py --help
```

Las utilidades de datos escriben en la base configurada: revisa sus argumentos
antes de ejecutarlas. La reorganizacion no requiere migraciones nuevas.
