"""Registra obligaciones y pagos de estudiantes y docentes."""

from alembic import op
import sqlalchemy as sa

revision = "d38b7c1e6a20"
down_revision = "c84f2d716a09"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "obligaciones_financieras",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("institucion_id", sa.Integer(), sa.ForeignKey("instituciones.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("tipo", sa.String(20), nullable=False),
        sa.Column("estudiante_id", sa.Integer(), nullable=True),
        sa.Column("docente_id", sa.Integer(), nullable=True),
        sa.Column("mes", sa.String(7), nullable=False),
        sa.Column("concepto", sa.String(160), nullable=False),
        sa.Column("monto", sa.Numeric(12, 2), nullable=False),
        sa.Column("moneda", sa.String(3), nullable=False),
        sa.Column("vence_en", sa.Date(), nullable=False),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("institucion_id", "id", name="uq_obligaciones_institucion_id"),
        sa.ForeignKeyConstraint(["institucion_id", "estudiante_id"], ["estudiantes.institucion_id", "estudiantes.id"], name="fk_obligacion_estudiante_institucion"),
        sa.ForeignKeyConstraint(["institucion_id", "docente_id"], ["docentes.institucion_id", "docentes.id"], name="fk_obligacion_docente_institucion"),
        sa.CheckConstraint("(tipo = 'ESTUDIANTE' AND estudiante_id IS NOT NULL AND docente_id IS NULL) OR (tipo = 'DOCENTE' AND docente_id IS NOT NULL AND estudiante_id IS NULL)", name="ck_obligacion_sujeto"),
        sa.CheckConstraint("monto > 0", name="ck_obligacion_monto"),
        sa.CheckConstraint("mes ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'", name="ck_obligacion_mes"),
    )
    op.create_index("ix_obligaciones_financieras_institucion_id", "obligaciones_financieras", ["institucion_id"])
    op.create_index("ix_obligaciones_financieras_institucion_tipo_mes", "obligaciones_financieras", ["institucion_id", "tipo", "mes"])
    op.create_table(
        "pagos_financieros",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("institucion_id", sa.Integer(), sa.ForeignKey("instituciones.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("obligacion_id", sa.Integer(), nullable=False),
        sa.Column("referencia", sa.String(100), nullable=False),
        sa.Column("monto", sa.Numeric(12, 2), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("metodo", sa.String(40), nullable=False),
        sa.Column("registrado_en", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["institucion_id", "obligacion_id"], ["obligaciones_financieras.institucion_id", "obligaciones_financieras.id"], name="fk_pago_obligacion_institucion"),
        sa.UniqueConstraint("institucion_id", "referencia", name="uq_pago_financiero_referencia"),
        sa.CheckConstraint("monto > 0", name="ck_pago_financiero_monto"),
    )
    op.create_index("ix_pagos_financieros_institucion_id", "pagos_financieros", ["institucion_id"])


def downgrade():
    op.drop_index("ix_pagos_financieros_institucion_id", table_name="pagos_financieros")
    op.drop_table("pagos_financieros")
    op.drop_index("ix_obligaciones_financieras_institucion_tipo_mes", table_name="obligaciones_financieras")
    op.drop_index("ix_obligaciones_financieras_institucion_id", table_name="obligaciones_financieras")
    op.drop_table("obligaciones_financieras")
