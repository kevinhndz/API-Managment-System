from sqlalchemy import Boolean, Column, Date, Integer, String, UniqueConstraint

from database.almacen import miClaseBase
from database.base import PoderAuditor


class Docentes(miClaseBase, PoderAuditor):
    __tablename__ = "docentes"

    id = Column(Integer, primary_key=True, index=True)
    numero_empleado = Column(String(20), nullable=False)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    foto = Column(String(500), nullable=True)
    correo = Column(String(150), nullable=False)
    especialidad = Column(String(120), nullable=False)
    cargo = Column(String(120), nullable=True)
    departamento = Column(String(120), nullable=True)
    tipo_contrato = Column(String(80), nullable=True)
    fecha_ingreso = Column(Date, nullable=True)
    estado = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("institucion_id", "id", name="uq_docentes_institucion_id"),
        UniqueConstraint("institucion_id", "numero_empleado", name="uq_docentes_institucion_numero_empleado"),
        UniqueConstraint("institucion_id", "correo", name="uq_docentes_institucion_correo"),
    )
