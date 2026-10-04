from datetime import date
from decimal import Decimal
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

NOMBRES_ASIGNATURAS = [
    'Programación I', 'Programación II', 'Sociología', 'Estructura de Datos',
    'Derecho Constitucional', 'Matemática I', 'Matemática II', 'Comunicación Oral y Escrita',
    'Bases de Datos I', 'Ingeniería de Software', 'Economía', 'Ética Profesional',
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
AREAS = [
    "Sistemas",
    "Administración",
    "Finanzas",
    "Mercadotecnia",
    "Industrial",
    "Civil",
    "Contaduría",
    "Derecho",
    "Psicología",
    "Matemáticas",
]


def cargar():
    db = llaves()
    try:
        db.execute(
            insert(Carreras).on_conflict_do_nothing(),
            [
                {
                    "codigo": f"DEMO-CAR-{i:02d}",
                    "nombre": f"Carrera Demo {i:02d}",
                    "duracion_anios": 4,
                    "activo": True,
                }
                for i in range(1, 11)
            ],
        )
        db.commit()
        carreras = (
            db.query(Carreras)
            .filter(Carreras.codigo.like("DEMO-%"))
            .order_by(Carreras.id)
            .all()
        )
        db.execute(
            insert(Aulas).on_conflict_do_nothing(),
            [
                {
                    "codigo": f"DEMO-AULA-{i:03d}",
                    "edificio": "Edificio UPH",
                    "capacidad": 35 + (i % 3) * 10,
                    "activo": True,
                }
                for i in range(1, 31)
            ],
        )
        db.commit()
        aulas = (
            db.query(Aulas).filter(Aulas.codigo.like("DEMO-%")).order_by(Aulas.id).all()
        )
        db.execute(
            insert(Docentes).on_conflict_do_nothing(),
            [
                {
                    "numero_empleado": f"DEMO-DOC-{i:03d}",
                    "nombres": NOMBRES[(i - 1) % 10],
                    "apellidos": f"{APELLIDOS[(i - 1) % 10]} {APELLIDOS[i % 10]}",
                    "correo": f"docente.demo{i:03d}@uph.edu",
                    "especialidad": AREAS[(i - 1) % 10],
                    "estado": True,
                }
                for i in range(1, 151)
            ],
        )
        db.commit()
        docentes = (
            db.query(Docentes)
            .filter(Docentes.numero_empleado.like("DEMO-%"))
            .order_by(Docentes.id)
            .all()
        )
        db.execute(
            insert(Asignaturas).on_conflict_do_nothing(),
            [
                {
                    "codigo": f"DEMO-ASI-{i:04d}",
                    "nombre": f"{NOMBRES_ASIGNATURAS[(i - 1) % len(NOMBRES_ASIGNATURAS)]} {(i - 1) // len(NOMBRES_ASIGNATURAS) + 1}",
                    "unidades_valorativas": 3 + i % 3,
                    "carrera_id": carreras[(i - 1) % 10].id,
                    "activo": True,
                }
                for i in range(1, 601)
            ],
        )
        db.commit()
        asignaturas = (
            db.query(Asignaturas)
            .filter(Asignaturas.codigo.like("DEMO-%"))
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
        db.execute(
            insert(Estudiantes).on_conflict_do_nothing(),
            [
                {
                    "cuenta": f"DEMO-EST-{i:04d}",
                    "nombre": f"Estudiante Demo {i:04d}",
                    "correo": f"estudiante.demo{i:04d}@uph.edu",
                    "telefono": f"9999{i:04d}",
                    "fechaNacimiento": date(1998 + i % 7, 1 + i % 9, 1),
                    "carrera_id": carreras[(i - 1) % 10].id,
                    "estado": True,
                }
                for i in range(1, 1001)
            ],
        )
        db.commit()
        estudiantes = (
            db.query(Estudiantes)
            .filter(Estudiantes.cuenta.like("DEMO-%"))
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
            inicio, fin = horas[((i - 1) // 150) % 4]
            secciones.append(
                {
                    "codigo": f"DEMO-SEC-{i:04d}",
                    "asignatura_id": asignaturas[i - 1].id,
                    "docente_id": docentes[(i - 1) % 150].id,
                    "periodo_id": periodo.id,
                    "aula_id": aula.id,
                    "dias": dias[((i - 1) // 150) % 4],
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
            .filter(Secciones.codigo.like("DEMO-%"))
            .order_by(Secciones.id)
            .all()
        )
        db.execute(
            insert(Matriculas).on_conflict_do_nothing(),
            [
                {
                    "estudiante_id": estudiantes[i - 1].id,
                    "seccion_id": secciones[i - 1].id,
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
                    "observacion": "Registro demo para pruebas",
                }
                for i, m in enumerate(matriculas)
            ],
        )
        db.commit()
        print(
            "Carga demo completada: 150 docentes, 10 carreras, 600 asignaturas, 600 secciones, 1000 estudiantes, 1000 matriculas y 1000 calificaciones."
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    cargar()
