from sqlalchemy import Column, ForeignKeyConstraint, Integer, String, UniqueConstraint
from database.almacen import miClaseBase
from database.base import PoderAuditor


class Secciones(miClaseBase, PoderAuditor):
    __tablename__ = "secciones"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), nullable=False)
    asignatura_id = Column(Integer, nullable=False)
    docente_id = Column(Integer, nullable=False)
    periodo_id = Column(Integer, nullable=False)
    aula_id = Column(Integer, nullable=False)
    dias = Column(String(30), nullable=False)
    hora_inicio = Column(String(10), nullable=False)
    hora_fin = Column(String(10), nullable=False)
    cupo_maximo = Column(Integer, nullable=False)
    estado = Column(String(20), default="ABIERTA", nullable=False)

    __table_args__ = (
        UniqueConstraint("institucion_id", "id", name="uq_secciones_institucion_id"),
        UniqueConstraint("institucion_id", "codigo", name="uq_secciones_institucion_codigo"),
        ForeignKeyConstraint(
            ["institucion_id", "asignatura_id"],
            ["asignaturas.institucion_id", "asignaturas.id"],
            name="fk_secciones_asignatura_institucion",
        ),
        ForeignKeyConstraint(
            ["institucion_id", "docente_id"],
            ["docentes.institucion_id", "docentes.id"],
            name="fk_secciones_docente_institucion",
        ),
        ForeignKeyConstraint(
            ["institucion_id", "periodo_id"],
            ["periodos.institucion_id", "periodos.id"],
            name="fk_secciones_periodo_institucion",
        ),
        ForeignKeyConstraint(
            ["institucion_id", "aula_id"],
            ["aulas.institucion_id", "aulas.id"],
            name="fk_secciones_aula_institucion",
        ),
    )
