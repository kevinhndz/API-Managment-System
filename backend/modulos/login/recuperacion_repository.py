from sqlalchemy import func
from sqlalchemy.orm import Session

from modulos.login.tabla import Usuarios
from modulos.solicitudes_cuenta.tabla import SolicitudesRecuperacion


class RecuperacionRepository:
    @staticmethod
    def buscar_usuario_activo_por_correo(db: Session, correo: str):
        return db.query(Usuarios).filter(
            func.lower(Usuarios.correo) == correo.casefold(),
            Usuarios.activo.is_(True),
        ).first()

    @staticmethod
    def contar_solicitudes_desde(db: Session, usuario_id: int, desde):
        return db.query(SolicitudesRecuperacion).filter(
            SolicitudesRecuperacion.usuario_id == usuario_id,
            SolicitudesRecuperacion.created_at >= desde,
        ).count()

    @staticmethod
    def crear_solicitud(db: Session, usuario_id: int, token_hash: str, ahora, expira_en):
        db.query(SolicitudesRecuperacion).filter(
            SolicitudesRecuperacion.usuario_id == usuario_id,
            SolicitudesRecuperacion.usado_en.is_(None),
        ).update({SolicitudesRecuperacion.usado_en: ahora})
        db.add(SolicitudesRecuperacion(
            usuario_id=usuario_id, token_hash=token_hash, expira_en=expira_en,
        ))
        db.commit()

    @staticmethod
    def invalidar_solicitud(db: Session, token_hash: str, ahora):
        db.query(SolicitudesRecuperacion).filter(
            SolicitudesRecuperacion.token_hash == token_hash,
        ).update({SolicitudesRecuperacion.usado_en: ahora})
        db.commit()

    @staticmethod
    def buscar_solicitud_vigente(db: Session, token_hash: str, ahora):
        return db.query(SolicitudesRecuperacion).filter(
            SolicitudesRecuperacion.token_hash == token_hash,
            SolicitudesRecuperacion.usado_en.is_(None),
            SolicitudesRecuperacion.expira_en > ahora,
        ).first()

    @staticmethod
    def buscar_usuario_activo(db: Session, usuario_id: int):
        return db.query(Usuarios).filter(
            Usuarios.id == usuario_id, Usuarios.activo.is_(True),
        ).first()

    @staticmethod
    def guardar_recuperacion_confirmada(db: Session, usuario_id: int, ahora):
        db.query(SolicitudesRecuperacion).filter(
            SolicitudesRecuperacion.usuario_id == usuario_id,
            SolicitudesRecuperacion.usado_en.is_(None),
        ).update({SolicitudesRecuperacion.usado_en: ahora})
        db.commit()
