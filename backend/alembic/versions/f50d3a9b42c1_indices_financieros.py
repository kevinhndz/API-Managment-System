"""Evita cargos duplicados y acelera la conciliacion de pagos."""

from alembic import op

revision = "f50d3a9b42c1"
down_revision = "e49c2f8a31b0"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index("uq_obligacion_estudiante_mes_concepto", "obligaciones_financieras", ["institucion_id", "estudiante_id", "mes", "concepto"], unique=True)
    op.create_index("uq_obligacion_docente_mes_concepto", "obligaciones_financieras", ["institucion_id", "docente_id", "mes", "concepto"], unique=True)
    op.create_index("ix_pagos_financieros_obligacion", "pagos_financieros", ["institucion_id", "obligacion_id"])


def downgrade():
    op.drop_index("ix_pagos_financieros_obligacion", table_name="pagos_financieros")
    op.drop_index("uq_obligacion_docente_mes_concepto", table_name="obligaciones_financieras")
    op.drop_index("uq_obligacion_estudiante_mes_concepto", table_name="obligaciones_financieras")
