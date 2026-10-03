from sqlalchemy import text

from database.almacen import llaves
from modulos.asignaturas.tabla import Asignaturas
from modulos.carreras.tabla import Carreras
from modulos.estudiantes.tabla import Estudiantes

NOMBRES = [
    "Introducción a la Ingeniería",
    "Matemática I",
    "Matemática II",
    "Matemática III",
    "Física I",
    "Física II",
    "Química General",
    "Comunicación Oral y Escrita",
    "Inglés I",
    "Inglés II",
    "Programación I",
    "Programación II",
    "Programación III",
    "Estructura de Datos",
    "Bases de Datos I",
    "Bases de Datos II",
    "Ingeniería de Software",
    "Redes de Computadoras",
    "Sistemas Operativos",
    "Inteligencia Artificial",
    "Cálculo Diferencial",
    "Cálculo Integral",
    "Estadística",
    "Contabilidad General",
    "Administración I",
    "Administración II",
    "Economía",
    "Mercadotecnia",
    "Finanzas",
    "Psicología General",
    "Personalidad I",
    "Personalidad II",
    "Psicología Social",
    "Anatomía I",
    "Anatomía II",
    "Fisiología",
    "Bioquímica",
    "Nutrición Básica",
    "Salud Pública",
    "Ética Profesional",
    "Metodología de la Investigación",
    "Dibujo Técnico",
    "Diseño Arquitectónico",
    "Resistencia de Materiales",
    "Circuitos Eléctricos",
    "Electrónica I",
    "Electrónica II",
    "Derecho Constitucional",
]


def corregir():
    db = llaves()
    db.expire_on_commit = False
    try:
        db.execute(
            text(
                "UPDATE asignaturas SET codigo = 'TEMP-COD-' || id, nombre = 'TEMP-NOMBRE-' || id, requisito_id = NULL"
            )
        )
        db.commit()
        materias = (
            db.query(Asignaturas).order_by(Asignaturas.id).limit(len(NOMBRES)).all()
        )
        for indice, materia in enumerate(materias):
            materia.nombre = NOMBRES[indice]
            materia.codigo = f"TEMP-FINAL-{materia.id}"

        programacion_1 = materias[10]
        programacion_2 = materias[11]
        programacion_3 = materias[12]
        programacion_1.codigo = "IS0"
        programacion_2.codigo = "IS1"
        programacion_3.codigo = "IS2"
        programacion_2.requisito_id = programacion_1.id
        programacion_3.requisito_id = programacion_2.id
        siguiente_codigo = 3
        for materia in materias:
            if materia not in (programacion_1, programacion_2, programacion_3):
                materia.codigo = f"IS{siguiente_codigo}"
                siguiente_codigo += 1
        db.commit()
        print("Asignaturas y requisitos actualizados correctamente.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    corregir()
