"""Agrega campos Paddle a la suscripcion institucional."""

from alembic import op
import sqlalchemy as sa

revision = "ab20f4c826d1"
down_revision = "f50d3a9b42c1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("suscripciones", sa.Column("actualizado_en", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")))
    for campo in ("paddle_customer_id", "paddle_subscription_id", "paddle_transaction_id", "paddle_price_id"):
        op.add_column("suscripciones", sa.Column(campo, sa.String(length=100), nullable=True))
    for campo in ("periodo_actual_inicio", "periodo_actual_fin", "ultimo_evento_paddle_en"):
        op.add_column("suscripciones", sa.Column(campo, sa.DateTime(timezone=True), nullable=True))
    op.add_column("suscripciones", sa.Column("cancelar_al_fin_periodo", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_unique_constraint("uq_suscripciones_paddle_subscription_id", "suscripciones", ["paddle_subscription_id"])
    op.create_unique_constraint("uq_suscripciones_paddle_transaction_id", "suscripciones", ["paddle_transaction_id"])
    op.drop_constraint("ck_suscripciones_estado", "suscripciones", type_="check")
    op.create_check_constraint("ck_suscripciones_estado", "suscripciones", "estado IN ('PRUEBA', 'ACTIVA', 'SUSPENDIDA', 'ATRASADA', 'CANCELADA', 'PAUSADA')")
    op.create_table("eventos_paddle",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("institucion_id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.String(length=100), nullable=False, unique=True),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("procesado_en", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["institucion_id"], ["instituciones.id"], name="fk_eventos_paddle_institucion_id", ondelete="RESTRICT"),
    )
    op.create_index("ix_eventos_paddle_institucion_id", "eventos_paddle", ["institucion_id"])


def downgrade():
    op.drop_index("ix_eventos_paddle_institucion_id", table_name="eventos_paddle")
    op.drop_table("eventos_paddle")
    op.drop_constraint("ck_suscripciones_estado", "suscripciones", type_="check")
    op.create_check_constraint("ck_suscripciones_estado", "suscripciones", "estado IN ('PRUEBA', 'ACTIVA', 'SUSPENDIDA')")
    op.drop_constraint("uq_suscripciones_paddle_transaction_id", "suscripciones", type_="unique")
    op.drop_constraint("uq_suscripciones_paddle_subscription_id", "suscripciones", type_="unique")
    for campo in ("cancelar_al_fin_periodo", "ultimo_evento_paddle_en", "periodo_actual_fin", "periodo_actual_inicio", "paddle_price_id", "paddle_transaction_id", "paddle_subscription_id", "paddle_customer_id", "actualizado_en"):
        op.drop_column("suscripciones", campo)
