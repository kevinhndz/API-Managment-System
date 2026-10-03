from sqlalchemy import update

from database.almacen import llaves
from modulos.asignaturas.tabla import Asignaturas
from modulos.carreras.tabla import Carreras
from modulos.estudiantes.tabla import Estudiantes
from modulos.matriculas.tabla import Matriculas

NOMBRES = [
    ("Ana", "Hernández"),
    ("Carlos", "Martínez"),
    ("María", "López"),
    ("José", "García"),
    ("Laura", "Flores"),
    ("Luis", "Castro"),
    ("Sofía", "Rivera"),
    ("Daniel", "Mejía"),
    ("Gabriela", "Pineda"),
    ("Miguel", "Vásquez"),
]


def corregir():
    db = llaves()
    db.expire_on_commit = False
    try:
        estudiantes = (
            db.query(Estudiantes)
            .filter(Estudiantes.cuenta.like("2026-%"))
            .order_by(Estudiantes.id)
            .all()
        )
        for indice, estudiante in enumerate(estudiantes, start=1):
            nombre, apellido = NOMBRES[(indice - 1) % len(NOMBRES)]
            estudiante.nombre = f"{nombre} {apellido}"
            estudiante.correo = (
                f"{nombre.lower()}.{apellido.lower()}-{indice:04d}@h.com"
            )
            estudiante.telefono = f"+504 9{indice:07d}"

        materias = (
            db.query(Asignaturas)
            .filter(Asignaturas.codigo.like("ASI-%"))
            .order_by(Asignaturas.id)
            .limit(48)
            .all()
        )
        todas_las_materias = db.query(Asignaturas).all()
        for materia in todas_las_materias:
            materia.codigo = f"TEMP-COD-{materia.id}"
        db.commit()
        nombres = [
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
        for indice, materia in enumerate(materias):
            materia.nombre = f"TEMP-NOMBRE-{materia.id}"
            materia.codigo = f"TEMP-{materia.id}"
            materia.requisito_id = None
        db.commit()

        for indice, materia in enumerate(materias):
            materia.nombre = nombres[indice]

        programacion_1 = next(x for x in materias if x.nombre == "Programación I")
        programacion_2 = next(x for x in materias if x.nombre == "Programación II")
        programacion_3 = next(x for x in materias if x.nombre == "Programación III")
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
        print("Datos de estudiantes y requisitos corregidos.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    corregir()
