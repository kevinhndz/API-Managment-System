from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKeyConstraint, Integer
from sqlalchemy.orm import Mapped, mapped_column

from database.almacen import miClaseBase
from database.base import EntidadInstitucional


class NotificacionesLeidas(miClaseBase, EntidadInstitucional):
    __tablename__ = "notificaciones_leidas"

    usuario_id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    evento_id: Mapped[int] = mapped_column(
        Integer, primary_key=True
    )
    leida_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        ForeignKeyConstraint(
            ["institucion_id", "usuario_id"],
            ["usuarios.institucion_id", "usuarios.id"],
            name="fk_notificaciones_leidas_usuario_institucion",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["institucion_id", "evento_id"],
            ["eventos_auditoria.institucion_id", "eventos_auditoria.id"],
            name="fk_notificaciones_leidas_evento_institucion",
            ondelete="CASCADE",
        ),
    )
