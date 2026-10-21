# Paddle Sandbox en el VPS

La suscripcion pertenece a `instituciones.id`. El webhook publico es
`https://api.mi-dominio.com/api/payments/paddle/webhook`. Nginx quita `/api`
antes de enviar la solicitud al contenedor. El backend tambien acepta la ruta
con `/api` si otro proxy conserva ese prefijo.

## Configuracion

1. En `.env`, define `PADDLE_ENVIRONMENT=sandbox`, `PADDLE_CLIENT_TOKEN`,
   `PADDLE_API_KEY`, `PADDLE_PRICE_ID` y `PADDLE_WEBHOOK_SECRET`. El ultimo
   valor se obtiene de la notificacion creada en Paddle. No uses la API key
   como secreto del webhook.
2. Configura `FRONTEND_ORIGINS` con el dominio HTTPS del frontend y
   `COOKIE_SAMESITE=none` si frontend y API estan en sitios distintos.
   `COOKIE_SECURE=true` viene del contenedor.
3. Construye el contenedor: `docker compose build`.
4. Aplica la migracion: `docker compose run --rm api alembic upgrade head`.
5. Inicia el backend: `docker compose up -d`.
6. Instala `deploy/nginx-api.conf.example` como configuracion de Nginx,
   sustituyendo el dominio y rutas del certificado. Valida con `nginx -t` y
   recarga Nginx.
7. En Paddle Sandbox, crea una notificacion URL para
   `https://api.mi-dominio.com/api/payments/paddle/webhook` y selecciona
   `transaction.completed`, `subscription.created`, `subscription.updated`,
   `subscription.canceled` y `subscription.past_due`. Copia el secreto de esa
   notificacion a `PADDLE_WEBHOOK_SECRET` y reinicia el contenedor.

El contenedor publica el puerto solo en `127.0.0.1` del VPS. Paddle debe
llamar al dominio HTTPS de Nginx, no al puerto 8000. El webhook no requiere
JWT ni CSRF; valida `Paddle-Signature` sobre el cuerpo original. Sin secreto
configurado responde 503 y no cambia ninguna suscripcion.

## Comprobacion manual en Sandbox

1. Entra como administrador de una universidad y abre **Suscripcion**.
2. Pulsa **Suscribir universidad** y paga con los datos de prueba de Paddle.
3. Comprueba en Paddle la transaccion y las entregas de webhook.
4. En la pantalla de planes pulsa **Actualizar estado**. Debe mostrar
   `ACTIVA`, el periodo y el enlace al portal de Paddle.
5. Repite la consulta con otra universidad: su suscripcion debe seguir
   independiente. Un docente puede ver el estado pero no iniciar el pago.
6. En el portal de Paddle programa la cancelacion. El acceso sigue hasta
   terminar el periodo; cuando Paddle marque la suscripcion como cancelada,
   el backend bloquea los modulos premium.
