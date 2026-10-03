from datetime import date
from decimal import Decimal

from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert

from database.almacen import llaves
from modulos.aulas.tabla import Aulas
from modulos.asignaturas.tabla import Asignaturas
from modulos.calificaciones.tabla import Calificaciones
from modulos.carreras.tabla import Carreras
from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.matriculas.tabla import Matriculas
from modulos.periodos.tabla import Periodos
from modulos.secciones.tabla import Secciones

CARRERAS = [
    ("IS", "Ingeniería en Sistemas"),
    ("II", "Ingeniería Industrial"),
    ("MED", "Medicina"),
    ("NUT", "Nutrición"),
    ("IE", "Ingeniería Eléctrica"),
    ("PSI", "Psicología"),
    ("NEG", "Negocios"),
    ("ADM", "Administración de Empresas"),
    ("DER", "Derecho"),
    ("ARQ", "Arquitectura"),
]

ASIGNATURAS = [
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

NOMBRES = [
    "Ana",
    "Carlos",
    "María",
    "José",
    "Laura",
    "Luis",
    "Sofía",
    "Daniel",
    "Gabriela",
    "Miguel",
]
APELLIDOS = [
    "Hernández",
    "Martínez",
    "López",
    "García",
    "Flores",
    "Castro",
    "Rivera",
    "Mejía",
    "Pineda",
    "Vásquez",
]


def cargar():
    db = llaves()
    db.expire_on_commit = False
    try:
        demo_estudiantes = [
            x.id
            for x in db.query(Estudiantes)
            .filter(Estudiantes.cuenta.like("DEMO-%"))
            .all()
        ]
        demo_secciones = [
            x.id
            for x in db.query(Secciones).filter(Secciones.codigo.like("DEMO-%")).all()
        ]
        demo_asignaturas = [
            x.id
            for x in db.query(Asignaturas)
            .filter(Asignaturas.codigo.like("DEMO-%"))
            .all()
        ]
        demo_docentes = [
            x.id
            for x in db.query(Docentes)
            .filter(Docentes.numero_empleado.like("DEMO-%"))
            .all()
        ]
        demo_carreras = [
            x.id
            for x in db.query(Carreras).filter(Carreras.codigo.like("DEMO-%")).all()
        ]
        demo_aulas = [
            x.id for x in db.query(Aulas).filter(Aulas.codigo.like("DEMO-%")).all()
        ]

        db.execute(
            delete(Calificaciones).where(
                Calificaciones.matricula_id.in_(
                    db.query(Matriculas.id).filter(
                        (Matriculas.estudiante_id.in_(demo_estudiantes))
                        | (Matriculas.seccion_id.in_(demo_secciones))
                    )
                )
            )
        )
        db.execute(
            delete(Matriculas).where(
                (Matriculas.estudiante_id.in_(demo_estudiantes))
                | (Matriculas.seccion_id.in_(demo_secciones))
            )
        )
        db.execute(delete(Secciones).where(Secciones.id.in_(demo_secciones)))
        db.execute(delete(Estudiantes).where(Estudiantes.id.in_(demo_estudiantes)))
        db.execute(delete(Asignaturas).where(Asignaturas.id.in_(demo_asignaturas)))
        db.execute(delete(Docentes).where(Docentes.id.in_(demo_docentes)))
        db.execute(delete(Carreras).where(Carreras.id.in_(demo_carreras)))
        db.execute(delete(Aulas).where(Aulas.id.in_(demo_aulas)))
        db.commit()

        carreras = [
            {
                "codigo": codigo,
                "nombre": nombre,
                "duracion_anios": 5 if "Ingeniería" in nombre else 4,
                "activo": True,
            }
            for codigo, nombre in CARRERAS
        ]
        db.execute(insert(Carreras).on_conflict_do_nothing(), carreras)
        db.commit()
        carreras = (
            db.query(Carreras)
            .filter(Carreras.codigo.in_([x[0] for x in CARRERAS]))
            .order_by(Carreras.id)
            .all()
        )

        aulas = [
            {
                "codigo": f"AULA-{i:03d}",
                "edificio": ["Edificio Norte", "Edificio Sur", "Edificio UPH"][i % 3],
                "capacidad": 35 + (i % 3) * 10,
                "activo": True,
            }
            for i in range(1, 31)
        ]
        db.execute(insert(Aulas).on_conflict_do_nothing(), aulas)
        db.commit()
        aulas = (
            db.query(Aulas).filter(Aulas.codigo.like("AULA-%")).order_by(Aulas.id).all()
        )

        docentes = [
            {
                "numero_empleado": f"DOC-{i:03d}",
                "nombres": NOMBRES[(i - 1) % 10],
                "apellidos": f"{APELLIDOS[(i - 1) % 10]} {APELLIDOS[i % 10]}",
                "correo": f"docente{i:03d}@uph.edu",
                "especialidad": ASIGNATURAS[(i - 1) % len(ASIGNATURAS)],
                "estado": True,
            }
            for i in range(1, 151)
        ]
        db.execute(insert(Docentes).on_conflict_do_nothing(), docentes)
        db.commit()
        docentes = (
            db.query(Docentes)
            .filter(Docentes.numero_empleado.like("DOC-%"))
            .order_by(Docentes.id)
            .all()
        )

        materias = [
            {
                "codigo": f"ASI-{i:04d}",
                "nombre": f"{ASIGNATURAS[(i - 1) % len(ASIGNATURAS)]} {((i - 1) // len(ASIGNATURAS)) + 1 if i > len(ASIGNATURAS) else ''}".strip(),
                "unidades_valorativas": 3 + i % 3,
                "carrera_id": carreras[(i - 1) % len(carreras)].id,
                "activo": True,
            }
            for i in range(1, 601)
        ]
        db.execute(insert(Asignaturas).on_conflict_do_nothing(), materias)
        db.commit()
        materias = (
            db.query(Asignaturas)
            .filter(Asignaturas.codigo.like("ASI-%"))
            .order_by(Asignaturas.id)
            .all()
        )

        periodo = (
            db.query(Periodos)
            .filter(Periodos.anio == 2026, Periodos.numero == 3)
            .first()
        )
        if periodo is None:
            periodo = Periodos(
                anio=2026,
                numero=3,
                fecha_inicio=date(2026, 9, 1),
                fecha_fin=date(2026, 12, 15),
                activo=True,
            )
            db.add(periodo)
            db.commit()

        estudiantes = [
            {
                "cuenta": f"2026-{i:04d}",
                "nombre": f"{NOMBRES[(i - 1) % 10]} {APELLIDOS[(i - 1) % 10]}",
                "correo": f"{NOMBRES[(i - 1) % 10].lower()}.{APELLIDOS[(i - 1) % 10].lower()}-{i:04d}@h.com",
                "telefono": f"+504 9{i:07d}",
                "fechaNacimiento": date(1998 + i % 7, 1 + i % 9, 1),
                "carrera_id": carreras[(i - 1) % len(carreras)].id,
                "estado": True,
            }
            for i in range(1, 1001)
        ]
        db.execute(insert(Estudiantes).on_conflict_do_nothing(), estudiantes)
        db.commit()
        estudiantes = (
            db.query(Estudiantes)
            .filter(Estudiantes.cuenta.like("2026-%"))
            .order_by(Estudiantes.id)
            .all()
        )

        dias = ["LUN-MIE", "MAR-JUE", "LUN-VIE", "MIE-VIE"]
        horas = [
            ("07:00", "09:00"),
            ("09:00", "11:00"),
            ("13:00", "15:00"),
            ("15:00", "17:00"),
        ]
        secciones = []
        for i in range(1, 601):
            aula = aulas[(i - 1) % len(aulas)]
            inicio, fin = horas[((i - 1) // 150) % len(horas)]
            secciones.append(
                {
                    "codigo": f"SEC-{i:04d}",
                    "asignatura_id": materias[i - 1].id,
                    "docente_id": docentes[(i - 1) % len(docentes)].id,
                    "periodo_id": periodo.id,
                    "aula_id": aula.id,
                    "dias": dias[((i - 1) // 150) % len(dias)],
                    "hora_inicio": inicio,
                    "hora_fin": fin,
                    "cupo_maximo": min(aula.capacidad, 30),
                    "estado": "ABIERTA",
                }
            )
        db.execute(insert(Secciones).on_conflict_do_nothing(), secciones)
        db.commit()
        secciones = (
            db.query(Secciones)
            .filter(Secciones.codigo.like("SEC-%"))
            .order_by(Secciones.id)
            .all()
        )

        db.execute(
            insert(Matriculas).on_conflict_do_nothing(),
            [
                {
                    "estudiante_id": estudiantes[i - 1].id,
                    "seccion_id": secciones[(i - 1) % len(secciones)].id,
                    "fecha_matricula": date(2026, 8, 20),
                    "estado": "ACTIVA",
                }
                for i in range(1, 1001)
            ],
        )
        db.commit()
        matriculas = db.query(Matriculas).order_by(Matriculas.id).limit(1000).all()
        db.execute(
            insert(Calificaciones).on_conflict_do_nothing(),
            [
                {
                    "matricula_id": m.id,
                    "primer_parcial": Decimal(60 + i % 41),
                    "segundo_parcial": Decimal(60 + i % 41),
                    "tercer_parcial": Decimal(60 + i % 41),
                    "nota_final": Decimal(60 + i % 41),
                    "observacion": "Evaluación registrada",
                }
                for i, m in enumerate(matriculas)
            ],
        )
        db.commit()
        print("Datos académicos reales cargados correctamente.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    cargar()
