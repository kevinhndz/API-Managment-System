"""Prepara altas de universidad pendientes de Paddle."""

from alembic import op
import sqlalchemy as sa

revision = "96d4237f0a1c"
down_revision = "ab20f4c826d1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("usuarios", sa.Column("propietario", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("usuarios", sa.Column("estudiante_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_usuarios_estudiante_institucion", "usuarios", "estudiantes", ["institucion_id", "estudiante_id"], ["institucion_id", "id"])
    op.drop_constraint("ck_suscripciones_estado", "suscripciones", type_="check")
    op.create_check_constraint("ck_suscripciones_estado", "suscripciones", "estado IN ('PENDIENTE', 'PRUEBA', 'ACTIVA', 'SUSPENDIDA', 'ATRASADA', 'CANCELADA', 'PAUSADA')")
    op.create_table("altas_institucion",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("institucion_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False, unique=True),
        sa.Column("vence_en", sa.DateTime(timezone=True), nullable=False),
        sa.Column("creada_en", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["institucion_id"], ["instituciones.id"], name="fk_altas_institucion", ondelete="RESTRICT"),
        sa.UniqueConstraint("institucion_id", name="uq_altas_institucion"),
    )
    op.create_index("ix_altas_institucion_institucion_id", "altas_institucion", ["institucion_id"])


def downgrade():
    op.drop_index("ix_altas_institucion_institucion_id", table_name="altas_institucion")
    op.drop_table("altas_institucion")
    op.drop_constraint("ck_suscripciones_estado", "suscripciones", type_="check")
    op.create_check_constraint("ck_suscripciones_estado", "suscripciones", "estado IN ('PRUEBA', 'ACTIVA', 'SUSPENDIDA', 'ATRASADA', 'CANCELADA', 'PAUSADA')")
    op.drop_constraint("fk_usuarios_estudiante_institucion", "usuarios", type_="foreignkey")
    op.drop_column("usuarios", "estudiante_id")
    op.drop_column("usuarios", "propietario")
