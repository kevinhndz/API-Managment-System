"""Add profile photos, catalogue portraits, and notification read state."""

from alembic import op
import sqlalchemy as sa


revision = "ed4f7a2c9b10"
down_revision = "a7c8d9e0f1a2"
branch_labels = None
depends_on = None

FOTOS = [f"/avatars/persona-{numero:02d}.jpg" for numero in range(1, 13)]


def upgrade():
    op.add_column("usuarios", sa.Column("foto", sa.String(length=500), nullable=True))
    op.add_column("estudiantes", sa.Column("foto", sa.String(length=500), nullable=True))
    op.add_column("docentes", sa.Column("foto", sa.String(length=500), nullable=True))
    op.create_table(
        "notificaciones_leidas",
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("evento_id", sa.Integer(), nullable=False),
        sa.Column("leida_en", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["evento_id"], ["eventos_auditoria.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("usuario_id", "evento_id"),
    )

    for tabla in ("estudiantes", "docentes"):
        opciones = " ".join(
            f"WHEN {indice} THEN '{ruta}'" for indice, ruta in enumerate(FOTOS)
        )
        op.execute(
            f"UPDATE {tabla} SET foto = CASE floor(random() * {len(FOTOS)})::int "
            f"{opciones} ELSE '{FOTOS[0]}' END WHERE foto IS NULL"
        )


def downgrade():
    op.drop_table("notificaciones_leidas")
    op.drop_column("docentes", "foto")
    op.drop_column("estudiantes", "foto")
    op.drop_column("usuarios", "foto")
