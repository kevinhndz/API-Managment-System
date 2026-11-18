from sqlalchemy.orm import Session

from modulos.auditoria.tabla import EventoAuditoria


class AuditoriaRepository:
    @staticmethod
    def listar(db: Session, modulo, accion, usuario, desde, hasta, limite):
        consulta = db.query(EventoAuditoria)
        if modulo:
            consulta = consulta.filter(EventoAuditoria.modulo == modulo)
        if accion:
            consulta = consulta.filter(EventoAuditoria.accion == accion)
        if usuario:
            consulta = consulta.filter(EventoAuditoria.usuario.ilike(f"%{usuario}%"))
        if desde:
            consulta = consulta.filter(EventoAuditoria.fecha >= desde)
        if hasta:
            consulta = consulta.filter(EventoAuditoria.fecha <= hasta)
        return consulta.order_by(
            EventoAuditoria.fecha.desc(), EventoAuditoria.id.desc()
        ).limit(limite).all()

    @staticmethod
    def guardar_evento(db: Session, evento: EventoAuditoria):
        db.add(evento)
        db.commit()

    @staticmethod
    def insertar_eventos_en_transaccion(db: Session, eventos: list[dict]):
        db.connection().execute(EventoAuditoria.__table__.insert(), eventos)
