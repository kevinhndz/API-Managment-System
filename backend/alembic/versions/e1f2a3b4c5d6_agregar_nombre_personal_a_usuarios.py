"""Agregar un nombre visible separado del usuario de acceso."""

from alembic import op
import sqlalchemy as sa


revision = "e1f2a3b4c5d6"
down_revision = "d2a4b5c6e7f8"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("usuarios", sa.Column("nombre", sa.String(length=160), nullable=True))
    op.execute("UPDATE usuarios SET nombre = usuario WHERE nombre IS NULL")


def downgrade():
    op.drop_column("usuarios", "nombre")
