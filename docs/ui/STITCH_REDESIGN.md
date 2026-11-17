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
