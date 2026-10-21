"""Reportes de actividad y cambios sensibles por institucion."""

import json
from datetime import datetime, time, timezone
from types import SimpleNamespace

from sqlalchemy import func
from sqlalchemy.orm import Session

from modulos.auditoria.tabla import EventoAuditoria


def _consulta_base(db: Session, desde=None, hasta=None):
    institucion_id = db.info.get("institucion_id")
    if institucion_id is None:
        raise ValueError("Se requiere una institucion para consultar reportes")
    consulta = db.query(EventoAuditoria).filter(
        EventoAuditoria.institucion_id == institucion_id
    )
    if desde is not None:
        consulta = consulta.filter(EventoAuditoria.fecha >= datetime.combine(desde, time.min, timezone.utc))
    if hasta is not None:
        consulta = consulta.filter(EventoAuditoria.fecha <= datetime.combine(hasta, time.max, timezone.utc))
    return consulta


def actividad_por_usuario(db: Session, desde=None, hasta=None):
    consulta = _consulta_base(db, desde, hasta).with_entities(
        EventoAuditoria.usuario.label("usuario"),
        EventoAuditoria.modulo.label("modulo"),
        EventoAuditoria.accion.label("accion"),
        func.count(EventoAuditoria.id).label("operaciones"),
        func.max(EventoAuditoria.fecha).label("ultima_actividad"),
    )
    return consulta.group_by(
        EventoAuditoria.usuario, EventoAuditoria.modulo, EventoAuditoria.accion
    ).order_by(func.count(EventoAuditoria.id).desc()).all()


def cambios_sensibles(db: Session, desde=None, hasta=None):
    eventos = (
        _consulta_base(db, desde, hasta)
        .filter(EventoAuditoria.modulo.in_((
            "calificaciones", "matriculas", "usuarios", "docentes", "estudiantes"
        )))
        .filter(EventoAuditoria.accion == "EDITAR")
        .order_by(EventoAuditoria.fecha.desc(), EventoAuditoria.id.desc())
        .all()
    )
    return [
        SimpleNamespace(
            fecha=evento.fecha,
            usuario=evento.usuario,
            modulo=evento.modulo,
            registro_id=evento.registro_id,
            campos=", ".join(sorted(set(evento.datos_anteriores or {}) | set(evento.datos_nuevos or {}))),
            antes=json.dumps(evento.datos_anteriores or {}, ensure_ascii=False),
            despues=json.dumps(evento.datos_nuevos or {}, ensure_ascii=False),
            ip_origen=evento.ip_origen,
        )
        for evento in eventos
    ]


CONSULTAS_AUDITORIA = {
    "actividad_usuario": actividad_por_usuario,
    "cambios_sensibles": cambios_sensibles,
}
