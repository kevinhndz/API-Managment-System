from sqlalchemy import Integer, String, Column, Boolean
from database.base import PoderAuditor
from database.almacen import miClaseBase

class Aulas(miClaseBase, PoderAuditor):
    __tablename__ = "aulas"  
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False)
    edificio = Column(String(80), nullable=False)
    capacidad = Column(Integer, nullable=False)
    activo = Column(Boolean, default=True)  