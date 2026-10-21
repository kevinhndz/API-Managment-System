from sqlalchemy import func
from sqlalchemy.orm import Session

from modulos.docentes.tabla import Docentes
from modulos.estudiantes.tabla import Estudiantes
from modulos.finanzas.tabla import ObligacionFinanciera, PagoFinanciero


def buscar_sujeto(db: Session, tipo: str, sujeto_id: int):
    clase = Estudiantes if tipo == "ESTUDIANTE" else Docentes
    return db.query(clase).filter(clase.id == sujeto_id, clase.institucion_id == db.info["institucion_id"]).one_or_none()


def buscar_obligacion(db: Session, id: int, bloquear: bool = False):
    consulta = db.query(ObligacionFinanciera).filter(
        ObligacionFinanciera.id == id,
        ObligacionFinanciera.institucion_id == db.info["institucion_id"],
    )
    return (consulta.with_for_update() if bloquear else consulta).one_or_none()


def referencia_existe(db: Session, referencia: str) -> bool:
    return db.query(PagoFinanciero.id).filter(
        PagoFinanciero.institucion_id == db.info["institucion_id"],
        PagoFinanciero.referencia == referencia,
    ).first() is not None


def total_pagado(db: Session, obligacion_id: int):
    return db.query(func.coalesce(func.sum(PagoFinanciero.monto), 0)).filter(
        PagoFinanciero.institucion_id == db.info["institucion_id"],
        PagoFinanciero.obligacion_id == obligacion_id,
    ).scalar()


def listar_obligaciones(db: Session, tipo: str | None = None, mes: str | None = None):
    consulta = db.query(ObligacionFinanciera).filter(ObligacionFinanciera.institucion_id == db.info["institucion_id"])
    if tipo:
        consulta = consulta.filter(ObligacionFinanciera.tipo == tipo)
    if mes:
        consulta = consulta.filter(ObligacionFinanciera.mes == mes)
    return consulta.order_by(ObligacionFinanciera.vence_en.desc(), ObligacionFinanciera.id.desc()).all()


def guardar(db: Session, registro):
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro
