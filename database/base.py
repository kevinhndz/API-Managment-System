from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer


def fecha_actual_utc_sin_zona():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class EntidadInstitucional:
    """Mixin for rows that belong to exactly one customer institution."""

    institucion_id = Column(
        Integer,
        ForeignKey("instituciones.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )


class PoderAuditor(EntidadInstitucional):
    created_at = Column(DateTime, default=fecha_actual_utc_sin_zona, nullable=False)
    updated_at = Column(
        DateTime,
        default=fecha_actual_utc_sin_zona,
        onupdate=fecha_actual_utc_sin_zona,
        nullable=False
    )
