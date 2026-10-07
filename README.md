# CampusFlow

Sistema de gestion academica con una API FastAPI y un panel React con TypeScript. Incluye administracion de aulas, personal docente, carreras, estudiantes, asignaturas, periodos, secciones, matriculas y calificaciones, ademas de reportes y auditoria.

## Requisitos para desarrollo

- Python 3.12 o compatible con las dependencias del proyecto.
- Node.js 22 o compatible con Vite 7.
- Una base de datos PostgreSQL.

## Preparar el backend

Desde la raiz del proyecto, crea y activa un entorno virtual, instala las dependencias con `pip install -r requirements-dev.txt` y copia `.env.example` a `.env`. Completa `DATABASE_URL` con la conexion de desarrollo y genera una clave aleatoria para `SECRET_KEY`. Para trabajar localmente, conserva `COOKIE_SECURE=false` y los origenes locales indicados en `FRONTEND_ORIGINS`.

Aplica las migraciones y arranca la API:

```bash
alembic upgrade head
uvicorn main:app --reload
```

La API local queda disponible en `http://127.0.0.1:8000`.

## Preparar el frontend

Desde `frontend`, instala dependencias con `npm ci`, copia `.env.example` a `.env.local` y ejecuta `npm run dev`. Vite sirve el panel en el puerto 5173 y reenvia `/api` al backend local.

El acceso usa cuentas activas guardadas en la base de datos. No hay una cuenta de demostracion configurada en el frontend. El navegador usa una cookie de sesion `HttpOnly`; los tokens no se guardan en `localStorage`. El endpoint Bearer anterior se mantiene para clientes existentes.

## Validar cambios

```bash
python -m pytest -q
```

Desde `frontend`:

```bash
npm run build
npm test
```

La compilacion del frontend incluye la verificacion estricta de TypeScript. El flujo de integracion continua ejecuta estas mismas validaciones en cada cambio de `main` o `refactor` y en las solicitudes de integracion.

## Configuracion antes de publicar

Usa una `SECRET_KEY` aleatoria y exclusiva del entorno, configura `FRONTEND_ORIGINS` con el origen exacto del panel y activa `COOKIE_SECURE=true` cuando la API se sirva bajo HTTPS. No publiques el archivo `.env` ni uses credenciales de desarrollo en una instalacion real.
