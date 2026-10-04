"""Reemplaza nombres temporales de asignaturas sin cambiar sus relaciones."""

from database.almacen import llaves
from modulos.asignaturas.tabla import Asignaturas
from modulos.aulas.tabla import Aulas
from modulos.carreras.tabla import Carreras
from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.periodos.tabla import Periodos
from modulos.secciones.tabla import Secciones
from modulos.matriculas.tabla import Matriculas
from modulos.calificaciones.tabla import Calificaciones

NOMBRES = [
    'Programación I', 'Programación II', 'Sociología', 'Estructura de Datos',
    'Derecho Constitucional', 'Matemática I', 'Matemática II', 'Comunicación Oral y Escrita',
    'Bases de Datos I', 'Ingeniería de Software', 'Economía', 'Ética Profesional',
]


def actualizar_nombres() -> int:
    with llaves() as db:
        materias = db.query(Asignaturas).order_by(Asignaturas.id).all()
        for index, materia in enumerate(materias):
            materia.nombre = f'__actualizando__{index}'
        db.commit()
        for index, materia in enumerate(materias):
            base = NOMBRES[index % len(NOMBRES)]
            materia.nombre = base if index < len(NOMBRES) else f'{base} {(index // len(NOMBRES)) + 1}'
        db.commit()
        return len(materias)


if __name__ == '__main__':
    print(f'Asignaturas actualizadas: {actualizar_nombres()}')
