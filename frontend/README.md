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

## Prueba de interfaz con API real

Con el backend local en 8000 y el frontend en 5173:

```bash
npx playwright install chromium
read -rs UI_TEST_PASSWORD
export UI_TEST_PASSWORD
npm run test:ui
unset UI_TEST_PASSWORD
```

Puedes configurar `UI_BASE_URL`, `UI_TEST_USER`, `UI_TEST_INSTITUTION` y
`UI_ARTIFACTS`. Usa una cuenta administradora con acceso a reportes. La prueba
inicia sesion desde el formulario, compara indicadores con la API, abre el
carnet y la carga docente, usa filtros y paginacion, consulta reportes con el
Worker, revisa CSV y descarga Excel. Tambien revisa actividad, vacios, tema
claro y cuatro pantallas a 390 px. Guarda capturas en `/tmp/campusflow-ui-artifacts`.
La exportacion de Excel produce el evento normal de auditoria del sistema.
