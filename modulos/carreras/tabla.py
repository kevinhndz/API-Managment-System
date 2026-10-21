from sqlalchemy import Boolean, Column, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from database.almacen import miClaseBase
from database.base import PoderAuditor


class Carreras(miClaseBase, PoderAuditor):
    __tablename__ = "carreras"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), nullable=False)
    nombre = Column(String(150), nullable=False)
    duracion_anios = Column(Integer, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("institucion_id", "id", name="uq_carreras_institucion_id"),
        UniqueConstraint("institucion_id", "codigo", name="uq_carreras_institucion_codigo"),
        UniqueConstraint("institucion_id", "nombre", name="uq_carreras_institucion_nombre"),
    )

    # relacion 1:n
    estudiantes = relationship("Estudiantes", back_populates="carrera")
