from alembic import op
import sqlalchemy as sa


revision = "b4d3a91f20c8"
down_revision = "c516d928395c"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "eventos_auditoria",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("usuario_id", sa.Integer(), nullable=True),
        sa.Column("usuario", sa.String(100), nullable=False),
        sa.Column("accion", sa.String(30), nullable=False),
        sa.Column("modulo", sa.String(60), nullable=False),
        sa.Column("registro_id", sa.Integer(), nullable=True),
        sa.Column("descripcion", sa.String(250), nullable=False),
        sa.Column("fecha", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_eventos_auditoria_fecha", "eventos_auditoria", ["fecha"])
    op.create_index("ix_eventos_auditoria_modulo_fecha", "eventos_auditoria", ["modulo", "fecha"])


def downgrade():
    op.drop_index("ix_eventos_auditoria_modulo_fecha", table_name="eventos_auditoria")
    op.drop_index("ix_eventos_auditoria_fecha", table_name="eventos_auditoria")
    op.drop_table("eventos_auditoria")
