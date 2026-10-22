from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from database.almacen import miClaseBase
from database.base import EntidadInstitucional


class ImportacionesPendientes(miClaseBase, EntidadInstitucional):
    __tablename__ = "importaciones_pendientes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    registros: Mapped[list] = mapped_column(JSON, nullable=False)
    errores: Mapped[list] = mapped_column(JSON, nullable=False)
    vence_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    aplicado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
