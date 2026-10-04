"""Reemplaza nombres temporales de asignaturas sin cambiar sus relaciones."""

from database.almacen import llaves
from modulos.asignaturas.tabla import Asignaturas

NOMBRES = [
    'Programación I', 'Programación II', 'Sociología', 'Estructura de Datos',
    'Derecho Constitucional', 'Matemática I', 'Matemática II', 'Comunicación Oral y Escrita',
    'Bases de Datos I', 'Ingeniería de Software', 'Economía', 'Ética Profesional',
]


def actualizar_nombres() -> int:
    with llaves() as db:
        materias = db.query(Asignaturas).filter(Asignaturas.nombre.ilike('%temp%')).order_by(Asignaturas.id).all()
        for index, materia in enumerate(materias):
            materia.nombre = f'{NOMBRES[index % len(NOMBRES)]} {(index // len(NOMBRES)) + 1}'
        db.commit()
        return len(materias)


if __name__ == '__main__':
    print(f'Asignaturas actualizadas: {actualizar_nombres()}')
