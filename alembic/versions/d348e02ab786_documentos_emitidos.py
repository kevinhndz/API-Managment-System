"""Registra documentos academicos y laborales emitidos."""

from alembic import op
import sqlalchemy as sa


revision = "d348e02ab786"
down_revision = "ab91d13c70e2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "documentos_emitidos",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("institucion_id", sa.Integer(), nullable=False),
        sa.Column("folio", sa.String(length=36), nullable=False),
        sa.Column("tipo", sa.String(length=40), nullable=False),
        sa.Column("sujeto_id", sa.Integer(), nullable=False),
        sa.Column("emitido_por", sa.Integer(), nullable=False),
        sa.Column("emitido_en", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("hash_pdf", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(["institucion_id"], ["instituciones.id"], name="fk_documentos_emitidos_institucion_id", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["institucion_id", "emitido_por"], ["usuarios.institucion_id", "usuarios.id"], name="fk_documentos_emitidos_emisor_institucion"),
        sa.UniqueConstraint("folio", name="uq_documentos_emitidos_folio"),
    )
    op.create_index("ix_documentos_emitidos_institucion_id", "documentos_emitidos", ["institucion_id"])
    op.create_index("ix_documentos_emitidos_institucion_fecha", "documentos_emitidos", ["institucion_id", "emitido_en"])


def downgrade():
    op.drop_index("ix_documentos_emitidos_institucion_fecha", table_name="documentos_emitidos")
    op.drop_index("ix_documentos_emitidos_institucion_id", table_name="documentos_emitidos")
    op.drop_table("documentos_emitidos")
