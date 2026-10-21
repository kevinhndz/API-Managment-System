export interface AcademicModuleCard {
  value: string
  src: string
  alt: string
  title: string
  subtitle: string
}

export const academicModuleCards: AcademicModuleCard[] = [
  { value: 'aulas', src: '/images/reportes/estudiantes.jpg', alt: 'Aula universitaria', title: 'Aulas', subtitle: 'Cambios y registros' },
  { value: 'docentes', src: '/images/reportes/docentes.jpg', alt: 'Docente dando una clase', title: 'Docentes', subtitle: 'Cambios y registros' },
  { value: 'carreras', src: '/images/reportes/matriculas.jpg', alt: 'Edificio universitario', title: 'Carreras', subtitle: 'Cambios y registros' },
  { value: 'estudiantes', src: '/images/reportes/estudiantes.jpg', alt: 'Estudiantes en el campus', title: 'Estudiantes', subtitle: 'Cambios y registros' },
  { value: 'asignaturas', src: '/images/reportes/asignaturas.jpg', alt: 'Libros y material académico', title: 'Asignaturas', subtitle: 'Cambios y registros' },
  { value: 'periodos', src: '/images/reportes/matriculas.jpg', alt: 'Calendario académico', title: 'Períodos', subtitle: 'Cambios y registros' },
  { value: 'secciones', src: '/images/reportes/docentes.jpg', alt: 'Salón de clases', title: 'Secciones', subtitle: 'Cambios y registros' },
  { value: 'matriculas', src: '/images/reportes/calificaciones.jpg', alt: 'Documentos de matrícula', title: 'Matrículas', subtitle: 'Cambios y registros' },
  { value: 'calificaciones', src: '/images/reportes/calificaciones.jpg', alt: 'Calificaciones académicas', title: 'Calificaciones', subtitle: 'Cambios y registros' },
  { value: 'matricula_carrera', src: '/images/reportes/calificaciones.jpg', alt: 'Documentos academicos', title: 'Matricula por carrera', subtitle: 'Evolucion por periodo' },
  { value: 'ocupacion_secciones', src: '/images/reportes/docentes.jpg', alt: 'Salon universitario', title: 'Ocupacion y cupos', subtitle: 'Demanda y capacidad' },
  { value: 'rendimiento_asignaturas', src: '/images/reportes/calificaciones.jpg', alt: 'Notas academicas', title: 'Rendimiento por asignatura', subtitle: 'Promedios y extremos' },
  { value: 'cobros_estudiantiles', src: '/images/reportes/calificaciones.jpg', alt: 'Cobros institucionales', title: 'Cobros estudiantiles', subtitle: 'Saldos y pagos por estudiante' },
  { value: 'nomina_docente', src: '/images/reportes/asignaturas.jpg', alt: 'Nomina institucional', title: 'Nomina docente', subtitle: 'Pagos y saldos por docente' },
  { value: 'detalle_carga_docente', src: '/images/reportes/docentes.jpg', alt: 'Docente en aula', title: 'Materias y secciones por docente', subtitle: 'Detalle de carga y horario' },
  { value: 'estudiantes_asignatura', src: '/images/reportes/calificaciones.jpg', alt: 'Estudiantes en una clase', title: 'Estudiantes por asignatura', subtitle: 'Matriculas por seccion y periodo' },
  { value: 'carga_docente', src: '/images/reportes/docentes.jpg', alt: 'Docente en clase', title: 'Carga docente', subtitle: 'Secciones y alumnos' },
  { value: 'asignaturas_sin_oferta', src: '/images/reportes/asignaturas.jpg', alt: 'Materias universitarias', title: 'Asignaturas sin oferta', subtitle: 'Materias sin seccion' },
  { value: 'poblacion_carrera', src: '/images/reportes/estudiantes.jpg', alt: 'Estudiantes universitarios', title: 'Poblacion por carrera', subtitle: 'Activos e inactivos' },
  { value: 'matricula_estado', src: '/images/reportes/calificaciones.jpg', alt: 'Inscripcion universitaria', title: 'Matricula por estado', subtitle: 'Seguimiento de inscripciones' },
  { value: 'constancia_estudiantil', src: '/images/reportes/calificaciones.jpg', alt: 'Documento universitario', title: 'Constancia estudiantil', subtitle: 'Matricula activa por estudiante' },
  { value: 'constancia_laboral', src: '/images/reportes/asignaturas.jpg', alt: 'Documento laboral', title: 'Constancia laboral', subtitle: 'Documento por docente' },
  { value: 'historial_academico', src: '/images/reportes/calificaciones.jpg', alt: 'Expediente academico', title: 'Historial academico', subtitle: 'Documento por estudiante' },
]
