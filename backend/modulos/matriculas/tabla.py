from datetime import date
from sqlalchemy import Column, Date, ForeignKeyConstraint, Integer, String, UniqueConstraint
from database.almacen import miClaseBase
from database.base import PoderAuditor


class Matriculas(miClaseBase, PoderAuditor):
    __tablename__ = "matriculas"
    id = Column(Integer, primary_key=True, index=True)
    estudiante_id = Column(Integer, nullable=False)
    seccion_id = Column(Integer, nullable=False)
    fecha_matricula = Column(Date, default=date.today, nullable=False)
    estado = Column(String(20), default="ACTIVA", nullable=False)

    __table_args__ = (
        UniqueConstraint("institucion_id", "id", name="uq_matriculas_institucion_id"),
        ForeignKeyConstraint(
            ["institucion_id", "estudiante_id"],
            ["estudiantes.institucion_id", "estudiantes.id"],
            name="fk_matriculas_estudiante_institucion",
        ),
        ForeignKeyConstraint(
            ["institucion_id", "seccion_id"],
            ["secciones.institucion_id", "secciones.id"],
            name="fk_matriculas_seccion_institucion",
        ),
    )
