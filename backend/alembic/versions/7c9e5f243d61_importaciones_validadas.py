"""Guarda vistas previas de importaciones institucionales."""

from alembic import op
import sqlalchemy as sa

revision = "7c9e5f243d61"
down_revision = "96d4237f0a1c"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("importaciones_pendientes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("institucion_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False, unique=True),
        sa.Column("tipo", sa.String(length=20), nullable=False),
        sa.Column("registros", sa.JSON(), nullable=False),
        sa.Column("errores", sa.JSON(), nullable=False),
        sa.Column("vence_en", sa.DateTime(timezone=True), nullable=False),
        sa.Column("aplicado_en", sa.DateTime(timezone=True), nullable=True),
        sa.Column("creado_en", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["institucion_id"], ["instituciones.id"], name="fk_importaciones_institucion_id", ondelete="RESTRICT"),
    )
    op.create_index("ix_importaciones_institucion_id", "importaciones_pendientes", ["institucion_id"])


def downgrade():
    op.drop_index("ix_importaciones_institucion_id", table_name="importaciones_pendientes")
    op.drop_table("importaciones_pendientes")
