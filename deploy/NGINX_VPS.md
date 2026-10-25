# Despliegue en VPS con Nginx

La tienda existente y CampusFlow viven en carpetas separadas. Un solo contenedor Nginx sirve ambos sitios y envia `/api/` y `/uploads/` al contenedor de la API.

## Dominios y HTTPS

Los dos dominios DuckDNS deben apuntar a la IP publica del VPS:

- CampusFlow: `campusuphflow.duckdns.org`
- TiendaMGR: `tiendamgr.duckdns.org`

Emite un certificado SAN que cubra ambos dominios con Certbot y webroot:

```bash
mkdir -p /srv/proyectos/ProxyNginx/letsencrypt
docker run --rm \
  -v /srv/proyectos/ProxyNginx/acme:/var/www/certbot \
  -v /srv/proyectos/ProxyNginx/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  --register-unsafely-without-email --agree-tos --no-eff-email \
  -d campusuphflow.duckdns.org -d tiendamgr.duckdns.org
```

El Nginx usa ese certificado para ambos sitios y redirige HTTP a HTTPS, excepto la ruta de validacion ACME.

## Activar Nginx

En `/srv/proyectos/ProxyNginx`, recrea el proxy despues de copiar la configuracion actualizada:

```bash
docker compose -f compose.vps.yaml up -d --force-recreate nginx
docker exec campusflow-nginx nginx -t
```

Configura la API para el dominio final en `/srv/proyectos/CampusFlow/.env`:

```dotenv
APP_ENV=production
COOKIE_SECURE=true
FRONTEND_ORIGINS=https://campusuphflow.duckdns.org
```

Recrea el contenedor de API para que cargue los cambios:

```bash
docker compose -f /srv/proyectos/ProxyNginx/compose.vps.yaml up -d --force-recreate api
```

## Renovacion automatica

Copia `renovar-certificados.sh` a `/usr/local/sbin/renovar-campusflow-certificados` y dale permiso de ejecucion. Agrega esta tarea a `/etc/cron.d/campusflow-certificados`:

```cron
17 3,15 * * * root /usr/local/sbin/renovar-campusflow-certificados >> /var/log/campusflow-certificados.log 2>&1
```

El script renueva cuando corresponde y recarga Nginx para que use los certificados actualizados.

## Paddle Sandbox

Registra esta URL como destino de notificaciones en Paddle Sandbox:

```text
https://campusuphflow.duckdns.org/api/payments/paddle/webhook
```

Copia el secreto que Paddle entrega a `PADDLE_WEBHOOK_SECRET` en el `.env` del VPS y recrea la API. El alta de una universidad se activa solo cuando llega el webhook firmado que confirma el pago inicial.
