from datetime import datetime, time, timezone

from sqlalchemy.orm import Session

from modulos.auditoria.repository import AuditoriaRepository as repo
from modulos.auditoria.tabla import EventoAuditoria


class AuditoriaService:
    @staticmethod
    def listar_actividad(db: Session, modulo, accion, usuario, desde, hasta, limite):
        inicio = datetime.combine(desde, time.min, timezone.utc) if desde else None
        fin = datetime.combine(hasta, time.max, timezone.utc) if hasta else None
        return repo.listar(db, modulo, accion, usuario, inicio, fin, limite)

    @staticmethod
    def registrar_evento(db: Session, usuario: dict | None, accion, modulo, descripcion, registro_id=None):
        if usuario is None:
            return
        evento = EventoAuditoria(
            usuario_id=usuario.get("user_id"),
            usuario=usuario.get("user", "Desconocido"),
            accion=accion,
            modulo=modulo,
            registro_id=registro_id,
            descripcion=descripcion,
        )
        repo.guardar_evento(db, evento)
