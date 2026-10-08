
## Temas  a defender

## OJO los temas 1 al 11 ya fueron implementados solo necesito que revises script.md para que entiendas como quiero que expliques cada tema, sin rodeas sin tecnisismos al grano. Facil de entender para cualquier non-tecnical person porque se implemento dicho tema.

## De los temas 12 - 17 son temas que aun no se han implementado en el proyecto. para esos no hagas una explicacion tipo script.md , una vez ya implementados lo haces, yo te idicare cuando.



### 1. Base de datos relacional y ORM

Las entidades académicas se guardan en tablas y se conectan por claves foráneas: por ejemplo, una matrícula vincula un estudiante con una sección, y una sección apunta a una asignatura, un docente, un período y un aula. Los servicios usan modelos SQLAlchemy para consultar esas relaciones y los esquemas devuelven datos al cliente. La configuración del motor y el creador de sesiones viven en `database/almacen.py` ([líneas 1–31](database/almacen.py)); el modelo de usuario muestra columnas, unicidad y una referencia a docente ([modulos/login/tabla.py, líneas 6–13](modulos/login/tabla.py)). El ORM permite trabajar con objetos de Python y consultas sin armar SQL manual para cada operación, mientras que las claves foráneas preservan integridad referencial en la base. Tiene sentido cuando los datos están relacionados y hay reglas entre ellos; para consultas muy especializadas aún puede convenir SQL explícito. No se debe decir que usar un ORM vuelve automáticamente rápida o segura una consulta: hay que revisar índices, número de consultas y tamaño de resultados según el uso real.


### 2. Separación por capas y módulos

En el módulo de estudiantes el router presenta las rutas HTTP, el esquema describe los datos, el servicio toma decisiones del caso de uso y el repositorio concentra consultas y persistencia. Se aprecia en el router que delega esService` ([modulos/estudiantes/router.py, líneas 1–32](modulos/estudiantes/router.py)), en las reglas y armado del registro del servicio ([modulos/estudiantes/service.py, líneas 17–43](modulos/estudiantes/service.py)) y en el repositorio que ejecuta el `query`, `commit` y `refresh` ([modulos/estudiantes/repository.py, líneas 6–23](modulos/estudiantes/repository.py)). No es una separación ceremonial: evita que una ruta tenga mezclados HTTP, validación académica y SQL; si cambia la interfaz o la forma de consultar datos, hay un lugar más claro para trabajar. Esta organización ayuda a crecer en entidades y a probar reglas aisladas. En un proyecto diminuto de un solo archivo podría ser excesiva; aquí existen varias entidades relacionadas y reglas que justifican separar responsabilidades. También es una base que se puede seguir mejorando: algunas convenciones de los módulos todavía no son idénticas, por lo que no conviene presentarla como arquitectura perfecta o completamente uniforme.




### 3. Autenticación con JWT y sesión en cookie HttpOnly (lo vi antes pero no con cookie solo gaurdado en localstorage)

Autenticar es comprobar quién presenta la solicitud. El backend construye un JWT firmado con identificador, rol y expiración de treinta minutos ([utils/token.py, líneas 8–34](utils/token.py)); la ruta web lo entrega como cookie `HttpOnly`, con opción `Secure`, `SameSite` y duración definida ([modulos/login/router.py, líneas 12–43](modulos/login/router.py)). `HttpOnly` evita que JavaScript de la página lea directamente el valor de esa cookie, y el frontend usa `credentials: 'include'` para enviarla al API ([frontend/src/services/api.ts, líneas 34–42](frontend/src/services/api.ts)). Al cerrar sesión el backend borra la cookie ([modulos/login/router.py, líneas 46–54](modulos/login/router.py)). La ruta Bearer sigue existiendo por compatibilidad. La cookie es una decisión para la sesión web; JWT es el formato firmado que viaja dentro de ella. Ninguna de las dos ideas reemplaza HTTPS: en despliegue real se debe activar `COOKIE_SECURE` cuando el sitio use HTTPS.

### 4. Autorización por rol

Autorizar es decidir qué puede hacer una identidad ya autenticada. `el_vigilante` obtiene el token de la cookie o de `Authorization`, valida el JWT y consulta de nuevo el usuario para confirmar que siga activo ([utils/auth.py, líneas 10–30](utils/auth.py)); `permiso_admin` limita operaciones a cuentas con rol administrativo ([utils/auth.py, líneas 33–36](utils/auth.py)). En `main.py`, esos permisos se aplican a los routers de módulos académicos, reportes y auditoría, mientras el router de login queda disponible para autenticación ([main.py, líneas 52–64](main.py)). Esta distinción evita confundir “tiene sesión” con “puede ejecutar cualquier operación”. Debe aplicarse en backend, porque ocultar un botón en React no protege el endpoint. El proyecto tiene un control administrativo básico; todavía no es una matriz granular de permisos por acción o por institución. En una aplicación con perfiles diferentes se extendería con políticas más precisas, pero no se justifica inventar decenas de roles antes de tener necesidades reales.

### 5. CORS y configuración por entorno

CORS es una regla del navegador que determina desde qué orígenes web se permite que JavaScript lea respuestas del API; no autentica usuarios ni bloquea por sí sola a clientes como Postman. CampusFlow toma los orígenes permitidos de `FRONTEND_ORIGINS`, habilita credenciales y limita métodos y cabeceras en el middleware de FastAPI ([main.py, líneas 25–36](main.py)); Pydantic Settings lee la configuración desde `.env` y define valores locales predeterminados para el frontend y la cookie ([core/config.py, líneas 3–18](core/config.py)). En desarrollo, el panel puede correr en `localhost:5173` y la API en otro puerto, por eso el navegador necesita la política CORS. En producción se configura el origen exacto del dominio, no `*` junto con credenciales. Las variables separadas por entorno evitan fijar secretos o direcciones particulares dentro del código; el archivo `.env` local no se sube al repositorio.

### 6. Manejo uniforme de errores

Una API debe comunicar fallos de manera que el cliente pueda reaccionar sin filtrar detalles internos. El backend define errores con significado —recurso inexistente, duplicado, credenciales inválidas o acceso prohibido— ([core/excepciones.py, líneas 1–24](core/excepciones.py)) y los convierte globalmente a respuestas JSON con códigos HTTP como 404, 409, 401 y 403 ([core/escuchadores.py, líneas 11–46](core/escuchadores.py)). Por ejemplo, si el servicio detecta una matrícula duplicada, lanza la excepción de dominio y el manejador construye la respuesta que recibe el frontend. Esta centralización evita copiar la misma construcción de respuestas en cada endpoint y hace más predecible la interfaz. Conviene usar errores específicos para situaciones esperables; no conviene ocultar cualquier excepción inesperada como si fuera un error normal, porque eso dificulta detectar defectos. CORS y manejo de excepciones son mecanismos distintos: uno regula lectura entre orígenes y el otro transforma fallos de la aplicación.

### 7. Paginación y límites de consulta

Listar todo de golpe parece simple mientras hay pocos registros, pero carga cada vez más la base, la red y el navegador. Los endpoints reciben `pagina_actual` y `limite` con restricciones, y el repositorio calcula el desplazamiento para traer solo un bloque de filas ([modulos/estudiantes/router.py, líneas 26–32](modulos/estudiantes/router.py); [modulos/estudiantes/repository.py, líneas 18–23](modulos/estudiantes/repository.py)). El servicio devuelve total, página, límite, número de páginas y datos mediante un esquema genérico ([core/schema.py, líneas 5–14](core/schema.py); [modulos/estudiantes/service.py, líneas 34–43](modulos/estudiantes/service.py)). El frontend muestra navegación numérica y el hook encapsula la carga y el estado de página ([frontend/src/hooks/usePagination.ts, líneas 1–39](frontend/src/hooks/usePagination.ts); [frontend/src/hooks/useCrudResource.ts, líneas 5–31](frontend/src/hooks/useCrudResource.ts)). La paginación evita transferir todos los registros de una vez y mantiene una respuesta acotada. Para volúmenes muy grandes podrían evaluarse cursores e índices; no se debe prometer que la paginación por desplazamiento resuelve cualquier escala sin medir la base y las consultas.

### 8. Auditoría y trazabilidad(tambien explica lo nuevo de database.base eso es nuevo el simple hecho de created at y lo demas y porque fue importante crear el modulo auditoria como esta compuesto y porque )

La auditoría responde preguntas que un CRUD por sí solo no contesta: qué usuario hizo una acción, en qué módulo y cuándo ocurrió. Un middleware identifica al usuario de la solicitud y mantiene ese contexto; los eventos se guardan y el listener observa cambios ORM de creación, edición y eliminación ([main.py, líneas 39–50](main.py); [modulos/auditoria/registro.py, líneas 10–73](modulos/auditoria/registro.py)). El endpoint permite consultar actividad por módulo, acción, usuario y fechas ([modulos/auditoria/router.py, líneas 11–37](modulos/auditoria/router.py)). La migración crea la tabla e índices de fecha y módulo ([alembic/versions/b4d3a91f20c8_crear_auditoria.py, líneas 5–30](alembic/versions/b4d3a91f20c8_crear_auditoria.py)). Esto es valioso para explicar cambios y apoyar revisiones administrativas. No es un SIEM ni un monitoreo de seguridad completo: hay que proteger la auditoría, decidir retención, vigilar eventos y probar restauración antes de presentarla como control de producción.


### 9. Migraciones versionadas con Alembic (solo relacionales)

El modelo Python describe cómo se espera que sean las tablas, pero una base existente necesita una ruta controlada para llegar a esa estructura. Alembic guarda cambios secuenciales con identificadores de revisión, una revisión padre y funciones `upgrade`/`downgrade`; la migración de auditoría, por ejemplo, crea su tabla e índices y también define cómo retirarlos ([alembic/versions/b4d3a91f20c8_crear_auditoria.py, líneas 5–30](alembic/versions/b4d3a91f20c8_crear_auditoria.py)). `alembic/env.py` carga la configuración y los modelos para comparar metadatos y ejecutar migraciones ([alembic/env.py, líneas 14–42 y 56–72](alembic/env.py)). Esto permite que desarrollo y pruebas compartan una historia del esquema en vez de depender de cambios manuales invisibles. Es especialmente importante cuando varias personas o entornos usan la misma aplicación. Una migración debe revisarse antes de aplicarse en datos importantes; `downgrade` no garantiza recuperar valores que se hayan perdido al transformar o borrar columnas.

### 10.1 Frontend con React y TypeScript -> 
(explicar sin tecnisismos porqueusar este stack es mejor que usar el CSS, JS, Y HML tadicional como ayuda en escabilidad , manetniilidad y estructura. explcia ras dieferenicas y decis quein es quien .  la equivalencia ) y deicr porque usar TypesCRIP es importante.

React organiza la interfaz como componentes que reaccionan al estado, y TypeScript declara la forma de entidades y respuestas para detectar incompatibilidades durante el desarrollo. `App.tsx` conecta rutas protegidas y carga las páginas de forma diferida ([frontend/src/App.tsx, líneas 1–48](frontend/src/App.tsx)); `api.ts` contiene una función común de `fetch`, los tipos de servicio CRUD y la creación de clientes por módulo ([frontend/src/services/api.ts, líneas 13–18 y 34–115](frontend/src/services/api.ts)). Así, la página de estudiantes no tiene que reconstruir a mano la URL para cada acción. React se justifica porque la aplicación tiene varias pantallas y estados interactivos; TypeScript ayuda a ver errores de contrato antes de que aparezcan solo al usar el sistema. Ninguno de los dos sustituye las validaciones del backend: los tipos del navegador pueden manipularse y el servidor siempre valida de nuevo.

### 10.2 Componentes reutilizables, formularios y experiencia de uso

Las páginas académicas comparten una tabla, búsqueda, formulario, filtros, estados de carga, paginación y acciones; `EntityPage` concentra buena parte de ese comportamiento genérico y recibe columnas, campos, etiquetas y servicio como propiedades ([frontend/src/components/crud/EntityPage.tsx, líneas 39–53 y 64–120](frontend/src/components/crud/EntityPage.tsx)). La página específica de estudiantes configura campos, carrera real, búsqueda y estado sin volver a escribir toda la tabla ([frontend/src/pages/EstudiantesPage.tsx, líneas 13–45](frontend/src/pages/EstudiantesPage.tsx)). Esto reduce duplicación cuando se agregan o ajustan entidades, manteniendo al mismo tiempo una configuración particular por módulo. La abstracción conviene cuando varias pantallas repiten el mismo patrón; si dos componentes solo se parecen superficialmente, forzarlos dentro de una única plantilla puede volver el código más difícil de entender. También hay estados visibles de carga y error: son parte de la confiabilidad percibida, aunque no cambian las reglas de datos.

### 11 Pruebas automatizadas y validación continua

Las pruebas convierten supuestos en comprobaciones repetibles. El backend prueba que las rutas académicas existan en el contrato OpenAPI ([tests/test_api_contract.py, líneas 4–18](tests/test_api_contract.py)), que una sesión con cookie proteja rutas y que se rechace una cuenta desactivada ([tests/test_seguridad_auth.py, líneas 53–79 y 152–165](tests/test_seguridad_auth.py)), y que se produzcan archivos XLSX/PDF reales ([tests/test_reportes_auditoria.py, líneas 55–70](tests/test_reportes_auditoria.py)). El frontend también prueba llamadas HTTP, credenciales y comportamientos de componentes ([frontend/src/services/api.test.ts, líneas 6–36](frontend/src/services/api.test.ts); [frontend/src/pages/EstudiantesPage.test.tsx, líneas 33–69](frontend/src/pages/EstudiantesPage.test.tsx)). GitHub Actions automatiza pruebas del backend, compilación de TypeScript y pruebas del frontend en cambios de las ramas configuradas ([.github/workflows/validar.yml, líneas 1–53](.github/workflows/validar.yml)). Esto detecta regresiones más pronto y permite revisar cambios con evidencia, pero una suite verde solo demuestra lo cubierto por sus casos; no certifica seguridad total, rendimiento ni ausencia de errores.



### 12. Limites intentos de inicio de sesión

**Qué aportaría.** Reduciría la posibilidad de que alguien pruebe muchas contraseñas seguidas contra una cuenta. La API debería contar fallos por una combinación razonable de cuenta e IP, introducir una pausa o bloqueo temporal progresivo y responder con mensajes que no confirmen si un usuario existe. No debe ser un bloqueo permanente fácil de provocar contra la cuenta de otra persona. Si la aplicación se ejecuta en más de un proceso o servidor, el contador necesita almacenamiento compartido con expiración, como Redis, o un mecanismo equivalente; un contador solo en memoria se pierde al reiniciar y no coordina instancias.

**Cómo se comprobaría.** Pruebas con una secuencia de intentos fallidos, verificación del tiempo de espera, acceso correcto después de que expire y comportamiento de cuentas distintas. También habría que comprobar límites sin bloquear el login de todos los usuarios desde una sola IP compartida.



### 13. Administracion de Cuentas

### 13.1 Recuperación de contraseña

**Qué aportaría.** Un flujo para solicitar un enlace o código de restablecimiento enviado al correo ya registrado, validar un token aleatorio de un solo uso, exigir su expiración y permitir cambiar la clave sin revelar si la cuenta existe. El token de recuperación no debe ser el JWT de sesión y no debe guardarse en claro si puede almacenarse como hash. Después del cambio habría que decidir si se invalidan sesiones activas y registrar el evento sin escribir tokens ni contraseñas en logs.

**Qué requiere.** Un proveedor de correo configurado con secretos fuera del repositorio, límites de solicitudes y plantillas que no expongan información. También una política de duración y mensajes para direcciones que no pertenecen a una cuenta.

**Cómo se comprobaría.** Token vencido, token reutilizado, correo no registrado, correo registrado, cambio válido, contraseñas que incumplen la política y sesiones existentes tras un restablecimiento.

### 13.2 Registro público de cuentas

**Qué aportaría.** Un flujo de “Crear cuenta” accesible desde la pantalla de login, con validación del lado del servidor, unicidad de usuario y confirmación de correo antes de habilitar la cuenta cuando corresponda. Debe definirse quién puede registrarse: por ejemplo, docentes previamente cargados que verifican su correo institucional, invitaciones creadas por administración o un registro que queda pendiente de aprobación.

**Decisión de seguridad importante.** No permitir que una persona anónima elija `Administrador` en el formulario. El rol debe asignarlo el backend según una regla autorizada; la interfaz no es autoridad. La creación de cuentas administrativas debe seguir protegida por una persona con permiso o por un proceso de invitación controlado.

**Cómo se comprobaría.** Registro duplicado, datos inválidos, correo sin confirmar, rol enviado manipulado, invitación vencida o usada y alta válida en el flujo autorizado.

### 13.3 Administración del ciclo de vida de cuentas

**Qué aportaría.** Una pantalla y endpoints administrativos para activar o desactivar usuarios, cambiar roles autorizados, asociar una cuenta con su docente, revocar sesiones y revisar el estado de acceso. El backend debe validar permisos para cada acción, impedir que una operación deje el sistema sin administradores por accidente y registrar quién hizo el cambio. Esta administración no es lo mismo que el registro público: una crea acceso bajo reglas; la otra mantiene cuentas durante su vida.

**Decisiones necesarias.** Qué roles existen realmente, qué acciones puede realizar cada uno, cómo se recupera una cuenta desactivada y qué pasa con una sesión abierta al cambiar un permiso. Es mejor comenzar con una tabla breve de permisos que con muchos roles nominales sin diferencias prácticas.

**Cómo se comprobaría.** Un usuario no administrador no puede gestionar cuentas; un administrador puede hacer solo los cambios permitidos; una cuenta desactivada pierde acceso en solicitudes siguientes; y cada cambio deja un evento revisable.

### 14. Segundo factor con códigos temporales (TOTP)

**Qué aportaría.** Además de contraseña, el login pediría un código temporal generado por una aplicación autenticadora compatible con TOTP, como Google Authenticator. El servidor crea una clave secreta por cuenta, muestra un QR durante la configuración, exige un primer código válido para activar el factor y verifica códigos en una ventana de tiempo corta con tolerancia acotada al desfase del reloj. Los secretos TOTP se deben cifrar en reposo y nunca registrarse en logs.

**Recuperación.** Hay que diseñar códigos de respaldo de un solo uso, regeneración tras autenticación y desactivación protegida. Sin un método de recuperación, perder el teléfono puede dejar fuera al usuario legítimo; permitir desactivar 2FA solo con la contraseña debilitaría la protección.

**Cómo se comprobaría.** Código válido, inválido, expirado, repetido si se decide impedir su reuso, ventana de reloj, activación incompleta y recuperación segura. La prueba de experiencia debe incluir tanto la configuración inicial como el inicio de sesión cotidiano.

### 15. Inicio de sesión con Google (OAuth/OIDC)

**Qué aportaría.** Google confirma la identidad mediante OAuth 2.0/OpenID Connect y CampusFlow verifica el resultado para iniciar una sesión propia. Se deben validar `state`, `nonce`, emisor, audiencia, expiración y URL de retorno; no basta con recibir un correo del navegador. La cuenta externa se vincula por un identificador estable del proveedor y no solo por una cadena de correo sin verificar.

**Decisiones necesarias.** Qué usuarios pueden vincular Google, qué pasa si el correo ya está asociado a otra cuenta, cómo se desvincula la identidad y si un usuario con contraseña mantiene ambos métodos. Google autentica; no debe decidir automáticamente el rol académico ni el acceso administrativo.

**Cómo se comprobaría.** Flujo exitoso, `state` inválido, token de otro cliente, cuenta no permitida, correo no verificado, colisión de identidad y regreso correcto a la aplicación.

### 16. Endurecimiento de seguridad de la aplicación

**Qué ya existe.** La versión actual tiene hash de contraseñas, JWT, cookie `HttpOnly`, CORS con orígenes configurables y comprobación básica de rol y estado de cuenta. Este tema no debe presentarse como “empezar de cero”; el trabajo sería revisar esas bases sistemáticamente y cerrar riesgos que aún no estén cubiertos.

**Qué se evaluaría.** Protección CSRF apropiada para sesiones basadas en cookie, expiración y revocación de sesiones, rotación de secretos, configuración segura de HTTPS y cabeceras, control de entradas y archivos, exposición de errores, políticas de dependencias, permisos mínimos de la base y modelos de amenazas para operaciones sensibles. También se debe revisar que los endpoints no filtren datos entre usuarios o roles y que las decisiones de permisos estén probadas en el servidor.

**Cómo se comprobaría.** Una lista de amenazas por flujo, pruebas negativas de autorización y CSRF, revisión de dependencias y secretos, pruebas sobre cabeceras/configuración y una revisión manual de endpoints. “Seguridad completa” no es un estado permanente; es un ciclo de revisión, corrección y seguimiento.



### 17. Copias de seguridad y restauración de la base de datos

**Qué aportaría.** Un procedimiento repetible para respaldar la base de datos, proteger los archivos, definir frecuencia y retención, controlar acceso y recuperar los datos después de pérdida o corrupción. El plan debe fijar objetivos entendibles: cuántos datos se puede aceptar perder (RPO) y cuánto tiempo puede tardar la recuperación (RTO).

**La parte que suele olvidarse.** Una copia que nunca se ha restaurado no demuestra que sea utilizable. Se debe practicar la restauración en un entorno separado, verificar tablas, relaciones, migraciones y acceso a la aplicación, y documentar el resultado. Las credenciales de respaldo y sus ubicaciones no deben quedar dentro del repositorio.

**Cómo se comprobaría.** Restauración periódica en un entorno de ensayo, comprobación de integridad, registro de duración, comparación con RPO/RTO y ejercicio de recuperación documentado.




