"""Agrega datos laborales para constancias docentes."""

from alembic import op
import sqlalchemy as sa


revision = "ab91d13c70e2"
down_revision = "cc192a43de10"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("docentes", sa.Column("cargo", sa.String(length=120), nullable=True))
    op.add_column("docentes", sa.Column("departamento", sa.String(length=120), nullable=True))
    op.add_column("docentes", sa.Column("tipo_contrato", sa.String(length=80), nullable=True))
    op.add_column("docentes", sa.Column("fecha_ingreso", sa.Date(), nullable=True))


def downgrade():
    op.drop_column("docentes", "fecha_ingreso")
    op.drop_column("docentes", "tipo_contrato")
    op.drop_column("docentes", "departamento")
    op.drop_column("docentes", "cargo")
