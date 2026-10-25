"""Persistencia de vistas previas y registros de una sola institucion."""

from datetime import date, datetime, timedelta, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from modulos.carreras.tabla import Carreras
from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.importaciones.tabla import ImportacionesPendientes

MODELOS = {"carreras": Carreras, "docentes": Docentes, "estudiantes": Estudiantes}
PRINCIPALES = {"carreras": "codigo", "docentes": "numero_empleado", "estudiantes": "cuenta"}


def datos_existentes(db: Session, tipo: str) -> dict:
    modelo = MODELOS[tipo]
    principal = PRINCIPALES[tipo]
    registros = db.query(modelo).all()
    carreras = db.query(Carreras).all()
    estudiantes = db.query(Estudiantes).all() if tipo == "estudiantes" else []
    return {
        "carreras": {item.codigo.casefold(): item.id for item in carreras},
        "principales": {str(getattr(item, principal)).strip().casefold() for item in registros},
        "nombres_carrera": {str(item.nombre).strip().casefold() for item in carreras} if tipo == "carreras" else set(),
        "correos": {str(item.correo).strip().casefold() for item in registros} if tipo != "carreras" else set(),
        "telefonos": {str(item.telefono).strip() for item in estudiantes if item.telefono},
    }


def guardar_vista(db: Session, token_hash: str, tipo: str, validos: list[dict], errores: list[dict]) -> None:
    db.add(ImportacionesPendientes(institucion_id=db.info["institucion_id"], token_hash=token_hash,
        tipo=tipo, registros=validos, errores=errores,
        vence_en=datetime.now(timezone.utc) + timedelta(hours=1)))
    db.commit()


def buscar_vista(db: Session, token_hash: str) -> ImportacionesPendientes | None:
    return db.query(ImportacionesPendientes).filter_by(token_hash=token_hash).with_for_update().one_or_none()


def aplicar_vista(db: Session, registro: ImportacionesPendientes) -> bool:
    modelo = MODELOS[registro.tipo]
    for fila in registro.registros:
        preparada = dict(fila)
        for clave in ("fecha_ingreso", "fechaNacimiento"):
            if preparada.get(clave):
                preparada[clave] = date.fromisoformat(preparada[clave])
        db.add(modelo(institucion_id=db.info["institucion_id"], **preparada))
    registro.aplicado_en = datetime.now(timezone.utc)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return False
    return True
