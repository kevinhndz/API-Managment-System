from sqlalchemy import Column, ForeignKeyConstraint, Integer, Numeric, String, UniqueConstraint
from database.almacen import miClaseBase
from database.base import PoderAuditor


class Calificaciones(miClaseBase, PoderAuditor):
    __tablename__ = "calificaciones"
    id = Column(Integer, primary_key=True, index=True)
    matricula_id = Column(Integer, nullable=False)
    primer_parcial = Column(Numeric(5, 2), nullable=False)
    segundo_parcial = Column(Numeric(5, 2), nullable=False)
    tercer_parcial = Column(Numeric(5, 2), nullable=False)
    nota_final = Column(Numeric(5, 2), nullable=False)
    observacion = Column(String(250), nullable=True)

    __table_args__ = (
        UniqueConstraint("institucion_id", "id", name="uq_calificaciones_institucion_id"),
        UniqueConstraint("institucion_id", "matricula_id", name="uq_calificaciones_institucion_matricula_id"),
        ForeignKeyConstraint(
            ["institucion_id", "matricula_id"],
            ["matriculas.institucion_id", "matriculas.id"],
            name="fk_calificaciones_matricula_institucion",
        ),
    )
