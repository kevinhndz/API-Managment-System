from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from database.almacen import miClaseBase


class NotificacionesLeidas(miClaseBase):
    __tablename__ = "notificaciones_leidas"

    usuario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True
    )
    evento_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("eventos_auditoria.id", ondelete="CASCADE"), primary_key=True
    )
    leida_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
