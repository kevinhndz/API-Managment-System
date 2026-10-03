from datetime import date
from sqlalchemy import Column, Date, ForeignKey, Integer, String
from database.almacen import miClaseBase
from database.base import PoderAuditor


class Matriculas(miClaseBase, PoderAuditor):
    __tablename__ = "matriculas"
    id = Column(Integer, primary_key=True, index=True)
    estudiante_id = Column(Integer, ForeignKey("estudiantes.id"), nullable=False)
    seccion_id = Column(Integer, ForeignKey("secciones.id"), nullable=False)
    fecha_matricula = Column(Date, default=date.today, nullable=False)
    estado = Column(String(20), default="ACTIVA", nullable=False)
