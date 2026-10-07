from datetime import datetime, timezone

from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database.almacen import miClaseBase


class EventoAuditoria(miClaseBase):
    __tablename__ = "eventos_auditoria"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    usuario: Mapped[str] = mapped_column(String(100), nullable=False)
    accion: Mapped[str] = mapped_column(String(30), nullable=False)
    modulo: Mapped[str] = mapped_column(String(60), nullable=False)
    registro_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    descripcion: Mapped[str] = mapped_column(String(250), nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_eventos_auditoria_fecha", "fecha"),
        Index("ix_eventos_auditoria_modulo_fecha", "modulo", "fecha"),
    )
