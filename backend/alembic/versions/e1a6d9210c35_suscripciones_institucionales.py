"""Agrega suscripciones por institucion y un periodo de prueba inicial."""

from alembic import op
import sqlalchemy as sa


revision = "e1a6d9210c35"
down_revision = "f82c91e630ab"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "suscripciones",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("institucion_id", sa.Integer(), nullable=False),
        sa.Column("plan", sa.String(length=40), nullable=False),
        sa.Column("estado", sa.String(length=20), nullable=False),
        sa.Column("inicia_en", sa.DateTime(timezone=True), nullable=False),
        sa.Column("vence_en", sa.DateTime(timezone=True), nullable=False),
        sa.Column("creada_en", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["institucion_id"], ["instituciones.id"], name="fk_suscripciones_institucion_id", ondelete="RESTRICT"),
        sa.UniqueConstraint("institucion_id", name="uq_suscripciones_institucion_id"),
        sa.CheckConstraint("vence_en > inicia_en", name="ck_suscripciones_fechas"),
        sa.CheckConstraint("estado IN ('PRUEBA', 'ACTIVA', 'SUSPENDIDA')", name="ck_suscripciones_estado"),
    )
    op.create_index("ix_suscripciones_institucion_id", "suscripciones", ["institucion_id"])
    op.execute(
        sa.text(
            "INSERT INTO suscripciones (institucion_id, plan, estado, inicia_en, vence_en) "
            "SELECT id, 'PILOTO', 'PRUEBA', now(), now() + interval '30 days' "
            "FROM instituciones"
        )
    )


def downgrade():
    op.drop_index("ix_suscripciones_institucion_id", table_name="suscripciones")
    op.drop_table("suscripciones")
