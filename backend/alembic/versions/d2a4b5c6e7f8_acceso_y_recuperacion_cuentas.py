"""Agregar solicitudes de cuenta y recuperacion de acceso."""

from alembic import op
import sqlalchemy as sa


revision = "d2a4b5c6e7f8"
down_revision = "b4d3a91f20c8"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("usuarios", sa.Column("correo", sa.String(length=150), nullable=True))
    op.add_column(
        "usuarios",
        sa.Column("version_token", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_usuarios_correo", "usuarios", ["correo"], unique=True)

    op.create_table(
        "solicitudes_cuenta",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre_completo", sa.String(length=160), nullable=False),
        sa.Column("correo", sa.String(length=150), nullable=False),
        sa.Column("usuario", sa.String(length=80), nullable=False),
        sa.Column("contrasena_hash", sa.String(length=255), nullable=False),
        sa.Column("estado", sa.String(length=20), nullable=False, server_default="PENDIENTE"),
        sa.Column("revisado_por", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=True),
        sa.Column("revisado_en", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_solicitudes_cuenta_id", "solicitudes_cuenta", ["id"])
    op.create_index("ix_solicitudes_cuenta_correo", "solicitudes_cuenta", ["correo"])
    op.create_index("ix_solicitudes_cuenta_usuario", "solicitudes_cuenta", ["usuario"])
    op.create_index("ix_solicitudes_cuenta_estado", "solicitudes_cuenta", ["estado"])

    op.create_table(
        "solicitudes_recuperacion",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False, unique=True),
        sa.Column("expira_en", sa.DateTime(), nullable=False),
        sa.Column("usado_en", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_solicitudes_recuperacion_id", "solicitudes_recuperacion", ["id"])
    op.create_index("ix_solicitudes_recuperacion_usuario_id", "solicitudes_recuperacion", ["usuario_id"])


def downgrade():
    op.drop_index("ix_solicitudes_recuperacion_usuario_id", table_name="solicitudes_recuperacion")
    op.drop_index("ix_solicitudes_recuperacion_id", table_name="solicitudes_recuperacion")
    op.drop_table("solicitudes_recuperacion")
    op.drop_index("ix_solicitudes_cuenta_estado", table_name="solicitudes_cuenta")
    op.drop_index("ix_solicitudes_cuenta_usuario", table_name="solicitudes_cuenta")
    op.drop_index("ix_solicitudes_cuenta_correo", table_name="solicitudes_cuenta")
    op.drop_index("ix_solicitudes_cuenta_id", table_name="solicitudes_cuenta")
    op.drop_table("solicitudes_cuenta")
    op.drop_index("ix_usuarios_correo", table_name="usuarios")
    op.drop_column("usuarios", "version_token")
    op.drop_column("usuarios", "correo")
