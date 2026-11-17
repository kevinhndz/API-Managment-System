# CampusFlow: referencia de interfaz

Rama: `feat/stitch-campusflow-ui`. Referencia: proyecto Stitch
`834855766792197258`, CampusFlow Redesign UI System.

Pantallas elegidas (versiones visibles del lienzo):

- Resumen academico: `1a55f3135e014eb996b31534c4cc9753`.
- Docentes refinado: `f11132a560f843949be76937991f10d3`.
- Reportes antes de consultar: `6677c93ccbe34bc4a6d7720e43f3e332`.
- Reportes consulta y exportacion: `c83d67cf20684fb0b62d98bf56e4148f`.
- Actividad con registro: `fed8f31f911b4151928d8b6cb076f4e7`.
- Actividad sin coincidencias: `73a034a547394f9f8d7eaeb31e16a14d`.

## Alcance

Replicar la composicion de estas referencias con los datos actuales de la API.
Usar Plus Jakarta Sans, superficies blancas, separadores finos y acciones
primarias violetas. Quitar carruseles, fotos decorativas, fondos animados y el
selector de tema del espacio academico. Conservar carnets, carga docente,
filtros, permisos, notificaciones, edicion, eliminacion y formatos de reporte.
Los valores de ejemplo de Stitch no se deben convertir en datos fijos.

## Integracion

Los pushes a la rama de trabajo no ejecutan CI/CD. La validacion local incluye
TypeScript, compilacion, pruebas de componentes, pruebas de API y navegacion
real con la API y Supabase. Abrir el PR hacia main solo tras completar esta
validacion. Integrar conservando los commits cuando los checks del PR pasen;
el push resultante a main usa el despliegue existente con rollback.

## Verificacion local del 17 de noviembre de 2026

- API: 79 pruebas correctas con SQLite aislado. Sin cambios de esquema.
- Frontend: suite completa de 84 pruebas y pruebas adicionales para la carrera
  entre solicitudes y la limpieza de filtros pendientes.
- TypeScript y compilacion de produccion comprobados durante la implementacion.
- Chromium contra API local conectada a Supabase: inicio de sesion desde el
  formulario, indicadores coincidentes con la API, docentes, filtros, paginacion,
  carnet, materias y secciones, consulta mediante Worker, vista CSV, descarga
  Excel real, actividad y estado vacio. Sin errores de JavaScript ni HTTP 500.
- Revision visual de capturas en escritorio y 390 px. El desplazamiento
  horizontal de tablas y grafica queda dentro de su contenedor.
- Se conserva el limite existente de 20 filas en la vista previa de reportes;
  la exportacion incluye todos los registros filtrados y la interfaz lo indica.

El workflow sigue limitado a pushes de main y PR hacia main. El trabajo en la
rama no despliega. La integracion requiere el resultado correcto del PR; despues
se comprueba el despliegue automatico, disponibilidad y acceso en produccion.
