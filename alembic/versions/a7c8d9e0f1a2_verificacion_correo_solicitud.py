"""Agregar verificacion de correo previo a solicitudes de cuenta."""

from alembic import op
import sqlalchemy as sa


revision = "a7c8d9e0f1a2"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "verificaciones_correo_solicitud",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("correo", sa.String(length=150), nullable=False),
        sa.Column("ip_hash", sa.String(length=64), nullable=False),
        sa.Column("codigo_hash", sa.String(length=64), nullable=False),
        sa.Column("expira_en", sa.DateTime(), nullable=False),
        sa.Column("reintentar_desde", sa.DateTime(), nullable=False),
        sa.Column("intentos", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ticket_hash", sa.String(length=64), nullable=True),
        sa.Column("ticket_expira_en", sa.DateTime(), nullable=True),
        sa.Column("consumido_en", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index(
        "ix_verificaciones_correo_solicitud_correo",
        "verificaciones_correo_solicitud",
        ["correo"],
    )
    op.create_index(
        "ix_verificaciones_correo_solicitud_ip_hash",
        "verificaciones_correo_solicitud",
        ["ip_hash"],
    )
    op.create_index(
        "ix_verificaciones_correo_solicitud_ticket_hash",
        "verificaciones_correo_solicitud",
        ["ticket_hash"],
        unique=True,
    )


def downgrade():
    op.drop_index(
        "ix_verificaciones_correo_solicitud_ticket_hash",
        table_name="verificaciones_correo_solicitud",
    )
    op.drop_index(
        "ix_verificaciones_correo_solicitud_ip_hash",
        table_name="verificaciones_correo_solicitud",
    )
    op.drop_index(
        "ix_verificaciones_correo_solicitud_correo",
        table_name="verificaciones_correo_solicitud",
    )
    op.drop_table("verificaciones_correo_solicitud")
