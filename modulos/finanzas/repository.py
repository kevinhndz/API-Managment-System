from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.excepciones import RecursoDuplicadoError
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


def obligacion_duplicada(db: Session, tipo: str, sujeto_id: int, mes: str, concepto: str) -> bool:
    campo = ObligacionFinanciera.estudiante_id if tipo == "ESTUDIANTE" else ObligacionFinanciera.docente_id
    return db.query(ObligacionFinanciera.id).filter(
        ObligacionFinanciera.institucion_id == db.info["institucion_id"],
        ObligacionFinanciera.tipo == tipo, campo == sujeto_id,
        ObligacionFinanciera.mes == mes, ObligacionFinanciera.concepto == concepto,
    ).first() is not None


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
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        if any(nombre in str(error.orig) for nombre in (
            "uq_pago_financiero_referencia", "uq_obligacion_estudiante_mes_concepto",
            "uq_obligacion_docente_mes_concepto",
        )):
            raise RecursoDuplicadoError("La referencia o la obligacion ya existe") from error
        raise
    db.refresh(registro)
    return registro
