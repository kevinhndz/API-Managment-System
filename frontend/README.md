# Frontend de CampusFlow

Aplicacion de gestion academica construida con React, TypeScript, Vite y Tailwind CSS.

## Ejecucion local

1. Instala Node.js 22 o una version compatible con Vite 7.
2. En esta carpeta, instala dependencias con `npm ci`.
3. Inicia el frontend con `npm run dev`.

Vite sirve la aplicacion en el puerto 5173 y envia las solicitudes de `/api` al backend local en el puerto 8000.
Para conectar otra API, copia `.env.example` como `.env.local` y configura `VITE_API_URL`.

El acceso requiere un usuario activo creado en el backend. No hay credenciales de demostracion configuradas en el frontend. El token de sesion se conserva en una cookie `HttpOnly`, no en `localStorage`.

## Validaciones

```bash
npm run typecheck
npm test
npm run build
```
