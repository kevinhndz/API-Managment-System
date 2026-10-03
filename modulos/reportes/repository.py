from sqlalchemy import func
from sqlalchemy.orm import Session
from modulos.asignaturas.tabla import Asignaturas
from modulos.carreras.tabla import Carreras
from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.matriculas.tabla import Matriculas
from modulos.secciones.tabla import Secciones
from modulos.periodos.tabla import Periodos
from modulos.aulas.tabla import Aulas
from modulos.calificaciones.tabla import Calificaciones

class ReportesRepository:
    @staticmethod
    def matriculas_repository(db: Session, periodo_id=None, estudiante_id=None):
        query = db.query(Estudiantes.id.label("estudiante_id"), Estudiantes.nombre.label("estudiante"), Asignaturas.nombre.label("asignatura"), Secciones.codigo.label("seccion"), Periodos.anio.label("periodo"), Matriculas.estado, Calificaciones.nota_final).join(Matriculas, Matriculas.estudiante_id == Estudiantes.id).join(Secciones, Secciones.id == Matriculas.seccion_id).join(Asignaturas, Asignaturas.id == Secciones.asignatura_id).join(Periodos, Periodos.id == Secciones.periodo_id).outerjoin(Calificaciones, Calificaciones.matricula_id == Matriculas.id)
        if periodo_id is not None: query = query.filter(Secciones.periodo_id == periodo_id)
        if estudiante_id is not None: query = query.filter(Matriculas.estudiante_id == estudiante_id)
        return query.all()
    @staticmethod
    def secciones_repository(db: Session, periodo_id=None):
        query = db.query(Secciones.codigo.label("seccion"), Asignaturas.nombre.label("asignatura"), (Docentes.nombres + " " + Docentes.apellidos).label("docente"), Periodos.anio.label("periodo"), Aulas.id.label("aula"), Secciones.cupo_maximo, func.count(Matriculas.id).label("matriculados")).join(Asignaturas, Asignaturas.id == Secciones.asignatura_id).join(Docentes, Docentes.id == Secciones.docente_id).join(Periodos, Periodos.id == Secciones.periodo_id).join(Aulas, Aulas.id == Secciones.aula_id).outerjoin(Matriculas, Matriculas.seccion_id == Secciones.id).group_by(Secciones.codigo, Asignaturas.nombre, Docentes.nombres, Docentes.apellidos, Periodos.anio, Aulas.id, Secciones.cupo_maximo)
        if periodo_id is not None: query = query.filter(Secciones.periodo_id == periodo_id)
        return query.all()
