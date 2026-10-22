# Alta de universidades con Paddle Sandbox

La universidad es `instituciones.id`. No existe una tabla de tenants adicional. Sus usuarios, estudiantes, docentes, datos academicos e importaciones llevan el mismo `institucion_id`. El alta publica crea una institucion inactiva, su administrador propietario y una suscripcion `PENDIENTE`. El checkout inicial nace solo en esa alta. El panel de administracion no puede crear otra suscripcion ni marcarla activa.

## Configuracion en el VPS

1. En `.env` configura `PADDLE_ENVIRONMENT=sandbox`, `PADDLE_CLIENT_TOKEN`, `PADDLE_API_KEY`, `PADDLE_PRICE_ID` y `PADDLE_WEBHOOK_SECRET` con valores propios de Paddle Sandbox. El secreto del webhook se obtiene al crear la notificacion; no es la API key. Si quieres mas de un plan, configura `PADDLE_PLANS` como un objeto JSON con nombres y price IDs, por ejemplo `{"Basico":"pri_...","Avanzado":"pri_..."}`. Deja `PADDLE_PRICE_ID` como respaldo de un plan unico.
2. Configura `FRONTEND_ORIGINS` con el origen HTTPS exacto del frontend. Si frontend y API usan sitios distintos, configura `COOKIE_SAMESITE=none`; en produccion, `COOKIE_SECURE=true`.
3. Ejecuta `docker compose build`, `docker compose run --rm api alembic upgrade head` y `docker compose up -d`.
4. Configura Nginx segun `deploy/nginx-api.conf.example` y instala un certificado HTTPS. El contenedor escucha solo en `127.0.0.1` del VPS.
5. Registra en Paddle Sandbox la URL `https://api.mi-dominio.com/api/payments/paddle/webhook` con `transaction.completed`, `subscription.created`, `subscription.updated`, `subscription.canceled` y `subscription.past_due`. Copia el secreto de esa notificacion a `PADDLE_WEBHOOK_SECRET` y reinicia el contenedor.

El precio debe existir como precio recurrente activo dentro de la misma cuenta Sandbox de la API key. Subir el backend al VPS no corrige un `PADDLE_PRICE_ID` invalido. Mientras falte `PADDLE_WEBHOOK_SECRET`, los planes se pueden consultar, pero el registro con pago permanece deshabilitado para evitar universidades que no puedan activarse.

Nginx quita `/api` antes de enviar la solicitud al contenedor. El backend tambien acepta la ruta con `/api` si el proxy conserva el prefijo. El webhook es publico, no usa JWT ni CSRF y verifica `Paddle-Signature` sobre el cuerpo original. Si falta el secreto, responde 503.

## Recorrido manual en Sandbox

1. Abre `/registrar-universidad` sin iniciar sesion. Elige plan, nombre, identificador y credenciales del administrador.
2. Completa el checkout de prueba. Antes del webhook, la institucion permanece inactiva y el administrador no puede iniciar sesion.
3. Comprueba en Paddle la transaccion y la entrega de `subscription.created`. En la pagina de alta debe aparecer `ACTIVA` tras la confirmacion.
4. Inicia sesion indicando el identificador de la universidad. En `Suscripcion` comprueba plan, fecha, historial, factura y enlace seguro para cambiar el metodo de pago.
5. Comprueba una segunda universidad: su estado y sus datos deben ser independientes. Una sesion de la primera no debe acceder a la segunda al cambiar el identificador.
6. Solicita cancelacion al final del periodo. Solo el webhook cambia el estado local. Mientras la cancelacion esta programada, se puede retirarla. Una suscripcion ya cancelada no se reactiva con este flujo: requiere un alta comercial asistida o un nuevo ciclo de suscripcion aprobado.

El cobro recurrente lo ejecuta Paddle. `Finanzas academicas` registra obligaciones de estudiantes y nomina docente, y no cobra la suscripcion SaaS.
