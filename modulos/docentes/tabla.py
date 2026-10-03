from sqlalchemy import Boolean, Column, Integer, String

from database.almacen import miClaseBase
from database.base import PoderAuditor


class Docentes(miClaseBase, PoderAuditor):
    __tablename__ = "docentes"

    id = Column(Integer, primary_key=True, index=True)
    numero_empleado = Column(String(20), unique=True, nullable=False)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    correo = Column(String(150), unique=True, nullable=False)
    especialidad = Column(String(120), nullable=False)
    estado = Column(Boolean, default=True, nullable=False)
