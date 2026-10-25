# Despliegue en VPS con Nginx

La tienda existente y CampusFlow quedan en carpetas separadas. Un solo contenedor Nginx sirve la tienda y el frontend de CampusFlow, y envia `/api/` y `/uploads/` al contenedor de la API.

## Preparacion inicial

1. Clona la rama `refactor` en `/srv/proyectos/CampusFlow` y crea `/srv/proyectos/ProxyNginx` para la configuracion compartida.
2. Copia el sitio estatico de TiendaMGR a `/srv/proyectos/TiendaMGR/public` y compila `frontend/dist` antes de subirlo al VPS.
3. Crea `/srv/proyectos/CampusFlow/.env` con los valores privados. Para la etapa previa al dominio, usa `APP_ENV=development` y `FRONTEND_ORIGINS=http://127.0.0.1:8080`. No copies el `.env` al repositorio.
4. Copia `deploy/compose.vps.yaml` y `deploy/nginx-campusflow.conf` a `/srv/proyectos/ProxyNginx`.
5. Prueba el proxy mientras Caddy conserva los puertos publicos:

   ```bash
   NGINX_HTTP_PORT=127.0.0.1:8080 NGINX_HTTPS_PORT=127.0.0.1:8443 docker compose -f /srv/proyectos/ProxyNginx/compose.vps.yaml up -d --build
   ```

   Comprueba localmente en el VPS con `curl -I http://127.0.0.1:8080/` y `curl -I -H 'Host: tiendamgr.duckdns.org' http://127.0.0.1:8080/`.

## Activar Nginx en los puertos publicos

Cuando el proxy de prueba responda para CampusFlow y TiendaMGR, detén el servicio Caddy de la tienda y vuelve a crear Nginx sin las variables de puertos:

```bash
docker compose -f /srv/proyectos/TiendaMGR/docker-compose.yml stop web
docker compose -f /srv/proyectos/ProxyNginx/compose.vps.yaml up -d
```

El certificado existente de TiendaMGR se monta desde el volumen `tiendamgr_caddy_data`. El dominio de CampusFlow usa HTTP hasta que se configure su DNS y su certificado.

## Dominio, HTTPS y Paddle Sandbox

Despues de apuntar el dominio DuckDNS de CampusFlow a la IP del VPS:

1. Configura `APP_ENV=production`, `COOKIE_SECURE=true` y `FRONTEND_ORIGINS=https://TU-DOMINIO` en `.env`.
2. Emite certificados para TiendaMGR y CampusFlow con Certbot usando el webroot `/srv/proyectos/ProxyNginx/acme`, y cambia los dos bloques HTTPS de Nginx para usar `/etc/letsencrypt/live/...`.
3. Reinicia la API para que lea la configuracion de produccion.
4. Registra en Paddle Sandbox `https://TU-DOMINIO/api/payments/paddle/webhook`, copia el secreto de esa notificacion a `PADDLE_WEBHOOK_SECRET` y reinicia la API.

La universidad no puede completar un registro con pago mientras falte el secreto del webhook. Paddle debe confirmar el pago inicial antes de activar la institucion.
