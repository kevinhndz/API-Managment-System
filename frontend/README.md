# CampusFlow Frontend

Dashboard académico construido con React 18, TypeScript estricto, Tailwind CSS y Recharts.

## Inicio local

```bash
npm install
npm run dev
```

Vite inicia en `http://127.0.0.1:5173` y redirige `/api` a `http://127.0.0.1:8000` durante desarrollo.

Para usar otra dirección de API, copia `.env.example` como `.env.local` y cambia `VITE_API_URL`.

## Acceso de demostración

- Correo: `admin@campusflow.edu`
- Contraseña: `Campus2026`

El login es una sesión local de demostración porque el backend actual no expone un endpoint de autenticación. Los CRUD consumen la API real.

## Scripts

```bash
npm run build
npm run typecheck
npm test
npm run preview
```

## Endpoints consumidos

- `/aulas`
- `/docentes`
- `/carreras`

Cada módulo utiliza GET paginado, GET por id, POST, PUT, PATCH y DELETE.
