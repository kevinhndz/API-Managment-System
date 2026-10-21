from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from core.excepciones import DatosInvalidosError, RecursoDuplicadoError, RecursoNoEncontradoError
from modulos.finanzas import repository as repo
from modulos.finanzas.schema import CrearObligacion, RegistrarPago
from modulos.finanzas.tabla import ObligacionFinanciera, PagoFinanciero


def crear_obligacion(db: Session, datos: CrearObligacion):
    sujeto_id = datos.estudiante_id if datos.tipo == "ESTUDIANTE" else datos.docente_id
    if sujeto_id is None or (datos.docente_id if datos.tipo == "ESTUDIANTE" else datos.estudiante_id) is not None:
        raise DatosInvalidosError("Selecciona solo el estudiante o docente correspondiente")
    if repo.buscar_sujeto(db, datos.tipo, sujeto_id) is None:
        raise RecursoNoEncontradoError("Persona no encontrada en esta institucion")
    if repo.obligacion_duplicada(db, datos.tipo, sujeto_id, datos.mes, datos.concepto):
        raise RecursoDuplicadoError("Ya existe una obligacion con ese concepto para esta persona y mes")
    obligacion = ObligacionFinanciera(**datos.model_dump(), institucion_id=db.info["institucion_id"])
    return repo.guardar(db, obligacion)


def registrar_pago(db: Session, obligacion_id: int, datos: RegistrarPago):
    obligacion = repo.buscar_obligacion(db, obligacion_id, bloquear=True)
    if obligacion is None:
        raise RecursoNoEncontradoError("Obligacion no encontrada")
    if repo.referencia_existe(db, datos.referencia):
        raise RecursoDuplicadoError("La referencia de pago ya existe")
    saldo = obligacion.monto - Decimal(repo.total_pagado(db, obligacion_id))
    if datos.monto > saldo:
        raise DatosInvalidosError("El pago supera el saldo pendiente")
    pago = PagoFinanciero(**datos.model_dump(), obligacion_id=obligacion_id, institucion_id=db.info["institucion_id"])
    return repo.guardar(db, pago)


def listar_saldos(db: Session, tipo: str | None = None, mes: str | None = None, estado: str | None = None):
    resultados = []
    for obligacion, cuenta, estudiante, empleado, nombres, apellidos, total_pagado in repo.listar_obligaciones(db, tipo, mes):
        sujeto_id = obligacion.estudiante_id if obligacion.tipo == "ESTUDIANTE" else obligacion.docente_id
        pagado = Decimal(total_pagado)
        saldo = obligacion.monto - pagado
        estado_real = "PAGADO" if saldo == 0 else "PARCIAL" if pagado > 0 else "VENCIDO" if obligacion.vence_en < date.today() else "PENDIENTE"
        if estado and estado_real != estado:
            continue
        resultados.append({
            "id": obligacion.id, "tipo": obligacion.tipo, "sujeto_id": sujeto_id,
            "codigo": cuenta if obligacion.tipo == "ESTUDIANTE" else empleado,
            "persona": estudiante if obligacion.tipo == "ESTUDIANTE" else f"{nombres} {apellidos}",
            "mes": obligacion.mes, "concepto": obligacion.concepto, "monto": obligacion.monto,
            "pagado": pagado, "saldo": saldo, "moneda": obligacion.moneda,
            "vence_en": obligacion.vence_en, "estado": estado_real,
        })
    return resultados
