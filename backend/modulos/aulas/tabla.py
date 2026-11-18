from sqlalchemy import Integer, String, Column, Boolean, UniqueConstraint
from database.base import PoderAuditor
from database.almacen import miClaseBase


class Aulas(miClaseBase, PoderAuditor):
    __tablename__ = "aulas"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), nullable=False)
    edificio = Column(String(80), nullable=False)
    capacidad = Column(Integer, nullable=False)
    activo = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("institucion_id", "id", name="uq_aulas_institucion_id"),
        UniqueConstraint("institucion_id", "codigo", name="uq_aulas_institucion_codigo"),
    )
