from sqlalchemy import Integer, String, Column, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database.almacen import miClaseBase
from database.base import PoderAuditor


class Estudiantes(miClaseBase, PoderAuditor):
    __tablename__ = "estudiantes"

    id = Column(Integer, primary_key=True, index=True)
    cuenta = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(150), nullable=False)
    correo = Column(String(150), unique=True, nullable=False)
    telefono = Column(String(20), unique=True, nullable=True)
    fechaNacimiento = Column(Date)
    carrera_id = Column(Integer, ForeignKey("carreras.id"), nullable=False)
    estado = Column(Boolean, default=True, nullable=False)

    # relacion n:1
    carrera = relationship("Carreras", back_populates="estudiantes")
