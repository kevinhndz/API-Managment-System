from datetime import datetime

from sqlalchemy import DateTime, ForeignKeyConstraint, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from database.almacen import miClaseBase
from database.base import EntidadInstitucional


class DocumentosEmitidos(miClaseBase, EntidadInstitucional):
    __tablename__ = "documentos_emitidos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    folio: Mapped[str] = mapped_column(String(36), nullable=False)
    tipo: Mapped[str] = mapped_column(String(40), nullable=False)
    sujeto_id: Mapped[int] = mapped_column(Integer, nullable=False)
    emitido_por: Mapped[int] = mapped_column(Integer, nullable=False)
    emitido_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    hash_pdf: Mapped[str] = mapped_column(String(64), nullable=False)

    __table_args__ = (
        UniqueConstraint("folio", name="uq_documentos_emitidos_folio"),
        ForeignKeyConstraint(
            ["institucion_id", "emitido_por"],
            ["usuarios.institucion_id", "usuarios.id"],
            name="fk_documentos_emitidos_emisor_institucion",
        ),
    )
