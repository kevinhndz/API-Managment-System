from sqlalchemy import Boolean, Column, ForeignKeyConstraint, Integer, String, UniqueConstraint

from database.almacen import miClaseBase
from database.base import PoderAuditor


class Asignaturas(miClaseBase, PoderAuditor):
    __tablename__ = "asignaturas"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), nullable=False)
    nombre = Column(String(150), nullable=False)
    unidades_valorativas = Column(Integer, nullable=False)
    carrera_id = Column(Integer, nullable=False)
    requisito_id = Column(Integer, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("institucion_id", "id", name="uq_asignaturas_institucion_id"),
        UniqueConstraint("institucion_id", "codigo", name="uq_asignaturas_institucion_codigo"),
        UniqueConstraint("institucion_id", "nombre", name="uq_asignaturas_institucion_nombre"),
        ForeignKeyConstraint(
            ["institucion_id", "carrera_id"],
            ["carreras.institucion_id", "carreras.id"],
            name="fk_asignaturas_carrera_institucion",
        ),
        ForeignKeyConstraint(
            ["institucion_id", "requisito_id"],
            ["asignaturas.institucion_id", "asignaturas.id"],
            name="fk_asignaturas_requisito_institucion",
        ),
    )
