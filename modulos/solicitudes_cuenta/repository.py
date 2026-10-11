from datetime import datetime

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from modulos.docentes.tabla import Docentes
from modulos.login.tabla import Usuarios
from modulos.solicitudes_cuenta.tabla import (
    SolicitudesCuenta,
    VerificacionesCorreoSolicitud,
)


def existe_cuenta_o_solicitud(db: Session, correo: str, usuario: str) -> bool:
    cuenta = db.query(Usuarios.id).filter(
        or_(
            func.lower(Usuarios.usuario) == usuario.casefold(),
            func.lower(Usuarios.correo) == correo.casefold(),
        )
    ).first()
    pendiente = db.query(SolicitudesCuenta.id).filter(
        SolicitudesCuenta.estado == "PENDIENTE",
        or_(
            func.lower(SolicitudesCuenta.usuario) == usuario.casefold(),
            func.lower(SolicitudesCuenta.correo) == correo.casefold(),
        ),
    ).first()
    return cuenta is not None or pendiente is not None


def contar_codigos_correo_desde(db: Session, correo: str, desde: datetime) -> int:
    return db.query(VerificacionesCorreoSolicitud.id).filter(
        VerificacionesCorreoSolicitud.correo == correo,
        VerificacionesCorreoSolicitud.created_at >= desde,
    ).count()


def contar_codigos_ip_desde(db: Session, ip_hash: str, desde: datetime) -> int:
    return db.query(VerificacionesCorreoSolicitud.id).filter(
        VerificacionesCorreoSolicitud.ip_hash == ip_hash,
        VerificacionesCorreoSolicitud.created_at >= desde,
    ).count()


def ultima_verificacion_correo(db: Session, correo: str):
    return db.query(VerificacionesCorreoSolicitud).filter(
        VerificacionesCorreoSolicitud.correo == correo,
    ).order_by(VerificacionesCorreoSolicitud.created_at.desc()).first()


def guardar_verificacion(db: Session, verificacion: VerificacionesCorreoSolicitud) -> None:
    ahora = verificacion.created_at
    db.query(VerificacionesCorreoSolicitud).filter(
        VerificacionesCorreoSolicitud.correo == verificacion.correo,
        VerificacionesCorreoSolicitud.consumido_en.is_(None),
    ).update({VerificacionesCorreoSolicitud.consumido_en: ahora})
    db.add(verificacion)
    db.query(VerificacionesCorreoSolicitud).filter(
        VerificacionesCorreoSolicitud.created_at < ahora.replace(hour=0, minute=0, second=0, microsecond=0),
    ).delete(synchronize_session=False)
    db.commit()


def obtener_verificacion(db: Session, verificacion_id: str, bloquear: bool = False):
    consulta = db.query(VerificacionesCorreoSolicitud).filter(
        VerificacionesCorreoSolicitud.id == verificacion_id,
    )
    if bloquear:
        consulta = consulta.with_for_update()
    return consulta.first()


def guardar_intento_verificacion(db: Session, verificacion: VerificacionesCorreoSolicitud) -> None:
    db.commit()


def invalidar_verificacion(db: Session, verificacion: VerificacionesCorreoSolicitud, ahora: datetime) -> None:
    verificacion.consumido_en = ahora
    db.commit()


def obtener_ticket_verificado(db: Session, ticket_hash: str):
    return db.query(VerificacionesCorreoSolicitud).filter(
        VerificacionesCorreoSolicitud.ticket_hash == ticket_hash,
    ).with_for_update().first()


def guardar_solicitud_y_consumir_ticket(
    db: Session,
    solicitud: SolicitudesCuenta,
    verificacion: VerificacionesCorreoSolicitud,
    ahora: datetime,
) -> None:
    verificacion.consumido_en = ahora
    db.add(solicitud)
    db.commit()


def listar_solicitudes(db: Session) -> list[SolicitudesCuenta]:
    return db.query(SolicitudesCuenta).order_by(
        SolicitudesCuenta.created_at.desc(),
    ).all()


def obtener_solicitud(db: Session, solicitud_id: int, bloquear: bool = False):
    consulta = db.query(SolicitudesCuenta).filter(SolicitudesCuenta.id == solicitud_id)
    if bloquear:
        consulta = consulta.with_for_update()
    return consulta.first()


def existe_usuario_con_correo_o_nombre(db: Session, correo: str, usuario: str) -> bool:
    return db.query(Usuarios.id).filter(
        or_(
            func.lower(Usuarios.usuario) == usuario.casefold(),
            func.lower(Usuarios.correo) == correo.casefold(),
        )
    ).first() is not None


def existe_docente_con_correo_o_numero(db: Session, correo: str, numero: str) -> bool:
    return db.query(Docentes.id).filter(
        or_(
            func.lower(Docentes.correo) == correo.casefold(),
            func.lower(Docentes.numero_empleado) == numero.casefold(),
        )
    ).first() is not None


def crear_docente(db: Session, docente: Docentes) -> int:
    db.add(docente)
    db.flush()
    return docente.id


def existe_docente(db: Session, docente_id: int) -> bool:
    return db.query(Docentes.id).filter(Docentes.id == docente_id).first() is not None


def existe_usuario_vinculado_docente(db: Session, docente_id: int) -> bool:
    return db.query(Usuarios.id).filter(Usuarios.docente_id == docente_id).first() is not None


def guardar_revision(db: Session, solicitud: SolicitudesCuenta, usuario: Usuarios) -> SolicitudesCuenta:
    db.add(usuario)
    db.commit()
    db.refresh(solicitud)
    return solicitud


def guardar_rechazo(db: Session, solicitud: SolicitudesCuenta) -> SolicitudesCuenta:
    db.commit()
    db.refresh(solicitud)
    return solicitud
