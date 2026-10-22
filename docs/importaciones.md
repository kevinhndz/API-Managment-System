# Importacion de datos por universidad

El administrador de una universidad activa abre `Importar datos` y sube CSV UTF-8 o XLSX de hasta 2 MB y 5000 filas. El sistema valida columnas, tipos y duplicados dentro de su `institucion_id`, muestra filas validas e invalidas y guarda una vista previa temporal de una hora. Al confirmar, inserta solo filas validas con el `institucion_id` de la sesion. El token de vista previa se usa una sola vez y esta limitado al mismo tenant. Primero se importan carreras y despues estudiantes para resolver `carrera_codigo` dentro de la universidad.

Columnas requeridas:

- Carreras: `codigo,nombre,duracion_anios`.
- Docentes: `numero_empleado,nombres,apellidos,correo,especialidad`. Opcionales: `cargo,departamento,tipo_contrato,fecha_ingreso`.
- Estudiantes: `cuenta,nombre,correo,carrera_codigo`. Opcionales: `telefono,fecha_nacimiento`.

Fechas opcionales usan `AAAA-MM-DD`. Una vista previa con errores puede aplicar solamente sus filas validas. Si otro proceso cambia los datos entre vista previa y confirmacion, la transaccion se revierte y se solicita una vista previa nueva.

## Migraciones grandes asistidas

Para mas de 5000 filas o sistemas de origen distintos, el equipo del SaaS recibe un export cifrado y un diccionario de columnas. Prepara un entorno de staging exclusivo para la institucion, valida relaciones, duplicados y conteos, muestra un informe de errores al responsable y obtiene su aprobacion del mapeo. La carga final usa transacciones por lotes con `institucion_id` fijado y verifica conteos y muestras tras el proceso. Nunca se asigna un identificador de otra universidad ni se mezcla informacion entre tenants.
