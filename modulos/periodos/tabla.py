from datetime import date

from sqlalchemy import Boolean, Column, Date, Integer

from database.almacen import miClaseBase
from database.base import PoderAuditor


class Periodos(miClaseBase, PoderAuditor):
    __tablename__ = "periodos"

    id = Column(Integer, primary_key=True, index=True)
    anio = Column(Integer, nullable=False)
    numero = Column(Integer, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
