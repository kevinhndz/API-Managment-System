from sqlalchemy import func
from sqlalchemy.orm import Session

from modulos.auditoria.tabla import EventoAuditoria
from modulos.login.tabla import Usuarios
from modulos.notificaciones.tabla import NotificacionesLeidas


def listar_cambios_docentes(db: Session, administrador_id: int, limite: int = 40):
    filas = (
        db.query(EventoAuditoria, NotificacionesLeidas.evento_id)
        .join(Usuarios, Usuarios.id == EventoAuditoria.usuario_id)
        .outerjoin(
            NotificacionesLeidas,
            (NotificacionesLeidas.evento_id == EventoAuditoria.id)
            & (NotificacionesLeidas.usuario_id == administrador_id),
        )
        .filter(
            func.lower(Usuarios.rol) == "docente",
            EventoAuditoria.accion.in_(("CREAR", "EDITAR", "ELIMINAR")),
        )
        .order_by(EventoAuditoria.fecha.desc(), EventoAuditoria.id.desc())
        .limit(limite)
        .all()
    )
    return [
        {
            "id": evento.id,
            "usuario": evento.usuario,
            "accion": evento.accion,
            "modulo": evento.modulo,
            "registro_id": evento.registro_id,
            "descripcion": evento.descripcion,
            "fecha": evento.fecha,
            "leida": evento_id is not None,
        }
        for evento, evento_id in filas
    ]


def buscar_cambio_docente(db: Session, evento_id: int):
    return (
        db.query(EventoAuditoria)
        .join(Usuarios, Usuarios.id == EventoAuditoria.usuario_id)
        .filter(
            EventoAuditoria.id == evento_id,
            func.lower(Usuarios.rol) == "docente",
            EventoAuditoria.accion.in_(("CREAR", "EDITAR", "ELIMINAR")),
        )
        .first()
    )


def notificacion_leida(db: Session, administrador_id: int, evento_id: int) -> bool:
    return (
        db.query(NotificacionesLeidas)
        .filter_by(usuario_id=administrador_id, evento_id=evento_id)
        .first()
        is not None
    )


def guardar_notificacion_leida(db: Session, administrador_id: int, evento_id: int) -> None:
    db.add(NotificacionesLeidas(usuario_id=administrador_id, evento_id=evento_id))
    db.commit()
