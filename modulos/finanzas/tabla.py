from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKeyConstraint, Index, Integer, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from database.almacen import miClaseBase
from database.base import EntidadInstitucional


class ObligacionFinanciera(miClaseBase, EntidadInstitucional):
    __tablename__ = "obligaciones_financieras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    estudiante_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    docente_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mes: Mapped[str] = mapped_column(String(7), nullable=False)
    concepto: Mapped[str] = mapped_column(String(160), nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), nullable=False, default="HNL")
    vence_en: Mapped[date] = mapped_column(Date, nullable=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("institucion_id", "id", name="uq_obligaciones_institucion_id"),
        ForeignKeyConstraint(["institucion_id", "estudiante_id"], ["estudiantes.institucion_id", "estudiantes.id"], name="fk_obligacion_estudiante_institucion"),
        ForeignKeyConstraint(["institucion_id", "docente_id"], ["docentes.institucion_id", "docentes.id"], name="fk_obligacion_docente_institucion"),
        CheckConstraint("(tipo = 'ESTUDIANTE' AND estudiante_id IS NOT NULL AND docente_id IS NULL) OR (tipo = 'DOCENTE' AND docente_id IS NOT NULL AND estudiante_id IS NULL)", name="ck_obligacion_sujeto"),
        CheckConstraint("monto > 0", name="ck_obligacion_monto"),
        CheckConstraint("length(mes) = 7 AND substr(mes, 5, 1) = '-' AND substr(mes, 6, 2) BETWEEN '01' AND '12'", name="ck_obligacion_mes"),
        Index("uq_obligacion_estudiante_mes_concepto", "institucion_id", "estudiante_id", "mes", "concepto", unique=True),
        Index("uq_obligacion_docente_mes_concepto", "institucion_id", "docente_id", "mes", "concepto", unique=True),
        Index("ix_obligaciones_financieras_institucion_tipo_mes", "institucion_id", "tipo", "mes"),
    )


class PagoFinanciero(miClaseBase, EntidadInstitucional):
    __tablename__ = "pagos_financieros"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    obligacion_id: Mapped[int] = mapped_column(Integer, nullable=False)
    referencia: Mapped[str] = mapped_column(String(100), nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    metodo: Mapped[str] = mapped_column(String(40), nullable=False)
    registrado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        ForeignKeyConstraint(["institucion_id", "obligacion_id"], ["obligaciones_financieras.institucion_id", "obligaciones_financieras.id"], name="fk_pago_obligacion_institucion"),
        UniqueConstraint("institucion_id", "referencia", name="uq_pago_financiero_referencia"),
        CheckConstraint("monto > 0", name="ck_pago_financiero_monto"),
        Index("ix_pagos_financieros_obligacion", "institucion_id", "obligacion_id"),
    )
