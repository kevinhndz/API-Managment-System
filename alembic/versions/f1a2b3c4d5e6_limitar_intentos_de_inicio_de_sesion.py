"""Agregar almacenamiento compartido para limitar intentos de acceso."""

from alembic import op
import sqlalchemy as sa


revision = "f1a2b3c4d5e6"
down_revision = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "intentos_inicio_sesion",
        sa.Column("clave_hash", sa.String(length=64), primary_key=True),
        sa.Column("intentos", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("nivel_bloqueo", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("inicio_ventana", sa.DateTime(timezone=True), nullable=False),
        sa.Column("bloqueado_hasta", sa.DateTime(timezone=True), nullable=True),
        sa.Column("actualizado_en", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_intentos_inicio_sesion_actualizado_en",
        "intentos_inicio_sesion",
        ["actualizado_en"],
    )


def downgrade():
    op.drop_index(
        "ix_intentos_inicio_sesion_actualizado_en",
        table_name="intentos_inicio_sesion",
    )
    op.drop_table("intentos_inicio_sesion")
