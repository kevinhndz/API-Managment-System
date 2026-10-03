from sqlalchemy import Column, ForeignKey, Integer, String
from database.almacen import miClaseBase
from database.base import PoderAuditor

class Secciones(miClaseBase, PoderAuditor):
    __tablename__ = "secciones"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False)
    asignatura_id = Column(Integer, ForeignKey("asignaturas.id"), nullable=False)
    docente_id = Column(Integer, ForeignKey("docentes.id"), nullable=False)
    periodo_id = Column(Integer, ForeignKey("periodos.id"), nullable=False)
    aula_id = Column(Integer, ForeignKey("aulas.id"), nullable=False)
    dias = Column(String(30), nullable=False)
    hora_inicio = Column(String(10), nullable=False)
    hora_fin = Column(String(10), nullable=False)
    cupo_maximo = Column(Integer, nullable=False)
    estado = Column(String(20), default="ABIERTA", nullable=False)
