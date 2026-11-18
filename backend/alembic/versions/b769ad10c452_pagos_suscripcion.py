"""Registra pagos asociados a la suscripcion institucional."""

from alembic import op
import sqlalchemy as sa


revision = "b769ad10c452"
down_revision = "d348e02ab786"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "pagos_suscripcion",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("institucion_id", sa.Integer(), nullable=False),
        sa.Column("referencia", sa.String(length=100), nullable=False),
        sa.Column("monto", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("moneda", sa.String(length=3), nullable=False),
        sa.Column("pagado_en", sa.DateTime(timezone=True), nullable=False),
        sa.Column("cubre_hasta", sa.DateTime(timezone=True), nullable=False),
        sa.Column("registrado_en", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["institucion_id"], ["instituciones.id"], name="fk_pagos_suscripcion_institucion_id", ondelete="RESTRICT"),
        sa.UniqueConstraint("institucion_id", "referencia", name="uq_pagos_suscripcion_institucion_referencia"),
        sa.CheckConstraint("monto > 0", name="ck_pagos_suscripcion_monto"),
    )
    op.create_index("ix_pagos_suscripcion_institucion_id", "pagos_suscripcion", ["institucion_id"])


def downgrade():
    op.drop_index("ix_pagos_suscripcion_institucion_id", table_name="pagos_suscripcion")
    op.drop_table("pagos_suscripcion")
