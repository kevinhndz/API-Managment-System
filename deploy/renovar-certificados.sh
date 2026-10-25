#!/bin/sh
set -eu

docker run --rm \
  -v /srv/proyectos/ProxyNginx/acme:/var/www/certbot \
  -v /srv/proyectos/ProxyNginx/letsencrypt:/etc/letsencrypt \
  certbot/certbot renew --webroot -w /var/www/certbot --quiet

docker exec campusflow-nginx nginx -s reload
