from datetime import datetime, timezone
from sqlalchemy import Column, DateTime


def fecha_actual_utc_sin_zona():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class PoderAuditor:
    created_at = Column(DateTime, default=fecha_actual_utc_sin_zona, nullable=False)
    updated_at = Column(
        DateTime,
        default=fecha_actual_utc_sin_zona,
        onupdate=fecha_actual_utc_sin_zona,
        nullable=False
    )
