"""Valida el mes financiero con una expresion compatible."""

from alembic import op
import sqlalchemy as sa

revision = "e49c2f8a31b0"
down_revision = "d38b7c1e6a20"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint("ck_obligacion_mes", "obligaciones_financieras", type_="check")
    op.create_check_constraint("ck_obligacion_mes", "obligaciones_financieras", "length(mes) = 7 AND substr(mes, 5, 1) = '-' AND substr(mes, 6, 2) BETWEEN '01' AND '12'")


def downgrade():
    op.drop_constraint("ck_obligacion_mes", "obligaciones_financieras", type_="check")
    op.create_check_constraint("ck_obligacion_mes", "obligaciones_financieras", "mes ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'")
