from sqlalchemy import Column, ForeignKey, Integer, Numeric, String
from database.almacen import miClaseBase
from database.base import PoderAuditor


class Calificaciones(miClaseBase, PoderAuditor):
    __tablename__ = "calificaciones"
    id = Column(Integer, primary_key=True, index=True)
    matricula_id = Column(
        Integer, ForeignKey("matriculas.id"), unique=True, nullable=False
    )
    primer_parcial = Column(Numeric(5, 2), nullable=False)
    segundo_parcial = Column(Numeric(5, 2), nullable=False)
    tercer_parcial = Column(Numeric(5, 2), nullable=False)
    nota_final = Column(Numeric(5, 2), nullable=False)
    observacion = Column(String(250), nullable=True)
