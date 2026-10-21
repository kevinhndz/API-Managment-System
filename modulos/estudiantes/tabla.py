from sqlalchemy import Integer, String, Column, Date, Boolean, ForeignKeyConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from database.almacen import miClaseBase
from database.base import PoderAuditor


class Estudiantes(miClaseBase, PoderAuditor):
    __tablename__ = "estudiantes"

    id = Column(Integer, primary_key=True, index=True)
    cuenta = Column(String(20), nullable=False)
    nombre = Column(String(150), nullable=False)
    foto = Column(String(500), nullable=True)
    correo = Column(String(150), nullable=False)
    telefono = Column(String(20), nullable=True)
    fechaNacimiento = Column(Date)
    carrera_id = Column(Integer, nullable=False)
    estado = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("institucion_id", "id", name="uq_estudiantes_institucion_id"),
        UniqueConstraint("institucion_id", "cuenta", name="uq_estudiantes_institucion_cuenta"),
        UniqueConstraint("institucion_id", "correo", name="uq_estudiantes_institucion_correo"),
        UniqueConstraint("institucion_id", "telefono", name="uq_estudiantes_institucion_telefono"),
        ForeignKeyConstraint(
            ["institucion_id", "carrera_id"],
            ["carreras.institucion_id", "carreras.id"],
            name="fk_estudiantes_carrera_institucion",
        ),
    )

    # relacion n:1
    carrera = relationship("Carreras", back_populates="estudiantes")
