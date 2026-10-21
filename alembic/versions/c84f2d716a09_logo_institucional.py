"""Guarda el logo de cada institucion para sus documentos."""

from alembic import op
import sqlalchemy as sa


revision = "c84f2d716a09"
down_revision = "b769ad10c452"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("instituciones", sa.Column("logo_png", sa.LargeBinary(), nullable=True))


def downgrade():
    op.drop_column("instituciones", "logo_png")
