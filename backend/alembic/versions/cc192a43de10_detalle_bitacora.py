"""Guarda contexto y diferencias de cambios en la bitacora."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "cc192a43de10"
down_revision = "e1a6d9210c35"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("eventos_auditoria", sa.Column("ip_origen", sa.String(length=45), nullable=True))
    op.add_column("eventos_auditoria", sa.Column("datos_anteriores", postgresql.JSONB(), nullable=True))
    op.add_column("eventos_auditoria", sa.Column("datos_nuevos", postgresql.JSONB(), nullable=True))


def downgrade():
    op.drop_column("eventos_auditoria", "datos_nuevos")
    op.drop_column("eventos_auditoria", "datos_anteriores")
    op.drop_column("eventos_auditoria", "ip_origen")
