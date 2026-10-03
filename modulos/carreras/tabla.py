from sqlalchemy import Boolean, Column, Integer, String

from database.almacen import miClaseBase
from database.base import PoderAuditor


class Carreras(miClaseBase, PoderAuditor):
    __tablename__ = "carreras"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(150), unique=True, nullable=False)
    duracion_anios = Column(Integer, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
