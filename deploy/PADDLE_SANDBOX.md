# Alta de universidades con Paddle Sandbox

La universidad es `instituciones.id`. No existe una tabla de tenants adicional. Sus usuarios, estudiantes, docentes, datos academicos e importaciones llevan el mismo `institucion_id`. El alta publica crea una institucion inactiva, su administrador propietario y una suscripcion `PENDIENTE`. Las instituciones existentes tambien pueden contratar un plan mensual desde **Suscripcion**. El acceso se habilita por el webhook firmado de Paddle, nunca por un cambio manual desde el panel.

## Configuracion en el VPS

1. En `.env` configura `PADDLE_ENVIRONMENT=sandbox`, `PADDLE_CLIENT_TOKEN`, `PADDLE_API_KEY`, `PADDLE_PRICE_ID` y `PADDLE_WEBHOOK_SECRET` con valores propios de Paddle Sandbox. El secreto del webhook se obtiene al crear la notificacion; no es la API key. Si quieres mas de un plan, configura `PADDLE_PLANS` como un objeto JSON con nombres y price IDs, por ejemplo `{"Basico":"pri_...","Avanzado":"pri_..."}`. Deja `PADDLE_PRICE_ID` como respaldo de un plan unico.
2. Configura `FRONTEND_ORIGINS` con el origen HTTPS exacto del frontend. Si frontend y API usan sitios distintos, configura `COOKIE_SAMESITE=none`; en produccion, `COOKIE_SECURE=true`.
3. Ejecuta `docker compose -f deploy/compose.yaml build`, `docker compose -f deploy/compose.yaml run --rm api alembic upgrade head` y `docker compose -f deploy/compose.yaml up -d`.
4. Configura Nginx segun `deploy/nginx-api.conf.example` y instala un certificado HTTPS. El contenedor escucha solo en `127.0.0.1` del VPS.
5. Registra en Paddle Sandbox la URL `https://api.mi-dominio.com/api/payments/paddle/webhook` con `transaction.completed`, `subscription.created`, `subscription.updated`, `subscription.canceled` y `subscription.past_due`. Copia el secreto de esa notificacion a `PADDLE_WEBHOOK_SECRET` y reinicia el contenedor.

El precio debe existir como precio recurrente activo dentro de la misma cuenta Sandbox de la API key. Subir el backend al VPS no corrige un `PADDLE_PRICE_ID` invalido. Mientras falte `PADDLE_WEBHOOK_SECRET`, los planes se pueden consultar, pero el registro con pago permanece deshabilitado para evitar universidades que no puedan activarse.

`PADDLE_CLIENT_TOKEN` debe contener el token publico completo de Checkout (`test_` seguido de 27 caracteres en Sandbox), no el identificador `ctkn_...` del registro ni la API key. Se copia en Settings / Authentication / Client-side tokens de Paddle Sandbox. Un token revocado, incompleto o de otra cuenta produce `invalid_client_token` al abrir el formulario, aunque la API del backend funcione. Reinicia el backend despues de cambiar el entorno local. El `.env` del VPS se configura por separado y nunca se incluye en Git.

Nginx quita `/api` antes de enviar la solicitud al contenedor. El backend tambien acepta la ruta con `/api` si el proxy conserva el prefijo. El webhook es publico, no usa JWT ni CSRF y verifica `Paddle-Signature` sobre el cuerpo original. Si falta el secreto, responde 503.

## Recorrido manual en Sandbox

1. Abre `/registrar-universidad` sin iniciar sesion. Elige plan, nombre, identificador y credenciales del administrador.
2. Completa el checkout de prueba. Antes del webhook, la institucion permanece inactiva y el administrador no puede iniciar sesion.
3. Comprueba en Paddle la transaccion y la entrega de `subscription.created`. En la pagina de alta debe aparecer `ACTIVA` tras la confirmacion.
4. Inicia sesion indicando el identificador de la universidad. En `Suscripcion` comprueba plan, fecha, historial, factura y enlace seguro para cambiar el metodo de pago.
5. Comprueba una segunda universidad: su estado y sus datos deben ser independientes. Una sesion de la primera no debe acceder a la segunda al cambiar el identificador.
6. Solicita cancelacion al final del periodo. Solo el webhook cambia el estado local. Mientras la cancelacion esta programada, se puede retirarla. Una suscripcion ya cancelada puede contratar un nuevo plan mensual desde **Suscripcion**.

## Pago desde una universidad existente

1. Inicia sesion como administrador y abre **Suscripcion** (`/planes`). Si la universidad conserva un piloto sin Paddle, o su suscripcion fue cancelada, aparece **Activar plan mensual** o **Renovar suscripcion**.
2. Selecciona el precio mensual y pulsa **Pagar plan mensual**. `POST /payments/checkout` usa la institucion de la sesion, valida el plan del catalogo y crea la transaccion en el backend. El precio debe ser recurrente mensual con frecuencia 1.
3. El formulario de Paddle se abre superpuesto dentro de CampusFlow. En Sandbox usa una tarjeta de prueba como `4242 4242 4242 4242`, fecha futura y CVC de prueba. No uses una tarjeta real.
4. Si cierras el formulario, **Continuar pago** reutiliza la transaccion pendiente. Una transaccion cobrada o en proceso no crea otro cobro: espera el webhook y pulsa **Comprobar pago**. La pagina consulta la confirmacion cada cinco segundos durante dos minutos; despues permite consultar de nuevo.
5. `subscription.created` debe incluir el mismo `transaction_id`, `custom_data.institucion_id` y el precio contratado. Solo tras verificar firma, pertenencia y periodo del evento se actualizan estado y vigencia. Comprueba que el acceso premium se habilita y que otra institucion no cambia.

Una suscripcion de Paddle que sigue activa, atrasada o pausada se gestiona con **Administrar plan** / **Ver opciones de pago**. No se crea otra para evitar suscripciones duplicadas. La renovacion recurrente pertenece a Paddle y usa el periodo del webhook; no se suma un mes manualmente a la base de datos. Este cambio no requiere una migracion.

El cobro recurrente lo ejecuta Paddle. `Finanzas academicas` registra obligaciones de estudiantes y nomina docente, y no cobra la suscripcion SaaS.
