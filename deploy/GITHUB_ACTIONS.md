# CI/CD de CampusFlow en GitHub Actions

El flujo `.github/workflows/desplegar-refactor.yml` se ejecuta al subir cambios a `refactor` o al iniciarlo manualmente desde GitHub Actions. No despliega `main`.

El flujo compila el frontend y construye la imagen de la API en GitHub. Luego transfiere los artefactos al VPS, actualiza el codigo de `refactor`, reemplaza API y archivos del frontend, recarga Nginx y comprueba `/api/docs`. Si la comprobacion final falla, restaura la imagen y el frontend anteriores.

## Acceso de despliegue

GitHub Actions usa una llave SSH dedicada para el usuario `campusflow-deploy` del VPS. No usa la llave personal del usuario `root`.

Configuracion requerida en los ajustes del repositorio:

### Secret

- `CAMPUSFLOW_DEPLOY_KEY`: llave privada SSH de la cuenta de despliegue.

### Variables

- `CAMPUSFLOW_VPS_HOST`: IP o nombre del VPS.
- `CAMPUSFLOW_VPS_USER`: usuario remoto de despliegue.
- `CAMPUSFLOW_VPS_KNOWN_HOSTS`: llave publica del host SSH para verificar el servidor.

No guardes la llave privada en el repositorio, en archivos `.env` ni en los logs de Actions.

## Ejecucion manual

En GitHub abre **Actions**, selecciona **CI CD CampusFlow** y usa **Run workflow** con la rama `refactor`. Tambien se ejecuta automaticamente al subir un commit a esa rama.
