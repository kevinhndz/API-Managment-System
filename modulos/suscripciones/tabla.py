from datetime import datetime

from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, Integer, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from database.almacen import miClaseBase
from database.base import EntidadInstitucional


class Suscripciones(miClaseBase, EntidadInstitucional):
    __tablename__ = "suscripciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan: Mapped[str] = mapped_column(String(40), nullable=False, default="PILOTO")
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="PRUEBA")
    inicia_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    vence_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("institucion_id", name="uq_suscripciones_institucion_id"),
        CheckConstraint("vence_en > inicia_en", name="ck_suscripciones_fechas"),
        CheckConstraint("estado IN ('PRUEBA', 'ACTIVA', 'SUSPENDIDA')", name="ck_suscripciones_estado"),
    )


class PagosSuscripcion(miClaseBase, EntidadInstitucional):
    __tablename__ = "pagos_suscripcion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    referencia: Mapped[str] = mapped_column(String(100), nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), nullable=False)
    pagado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    cubre_hasta: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    registrado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("institucion_id", "referencia", name="uq_pagos_suscripcion_institucion_referencia"),
        CheckConstraint("monto > 0", name="ck_pagos_suscripcion_monto"),
    )
