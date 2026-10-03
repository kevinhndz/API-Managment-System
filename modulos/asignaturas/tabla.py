from sqlalchemy import Boolean, Column, ForeignKey, Integer, String

from database.almacen import miClaseBase
from database.base import PoderAuditor


class Asignaturas(miClaseBase, PoderAuditor):
    __tablename__ = "asignaturas"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(150), unique=True, nullable=False)
    unidades_valorativas = Column(Integer, nullable=False)
    carrera_id = Column(Integer, ForeignKey("carreras.id"), nullable=False)
    requisito_id = Column(Integer, ForeignKey("asignaturas.id"), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
