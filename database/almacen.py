from fastapi import HTTPException, Request
from sqlalchemy import Boolean, Column, DateTime, Integer, String, UniqueConstraint, create_engine, event, func, true
from sqlalchemy.orm import Session, sessionmaker, DeclarativeBase, with_loader_criteria
from core.config import preparar_url_base_datos, settings as traer
from database.base import EntidadInstitucional
from utils.token import verificar_token

UBICACION_ALMACEN = preparar_url_base_datos(
    traer.DATABASE_URL.get_secret_value(), traer.APP_ENV
)

#  el motor usa pool_pre_ping para reconectar automaticamente la bd si la conexion muere
motor = create_engine(
    UBICACION_ALMACEN,
    pool_pre_ping=True
)


llaves = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=motor
)


class miClaseBase(DeclarativeBase):
    pass


class Instituciones(miClaseBase):
    __tablename__ = "instituciones"

    id = Column(Integer, primary_key=True)
    slug = Column(String(80), nullable=False)
    nombre = Column(String(200), nullable=False)
    activa = Column(Boolean, nullable=False, default=True, server_default=true())
    creada_en = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("slug", name="uq_instituciones_slug"),
    )


@event.listens_for(Session, "do_orm_execute")
def limitar_consultas_a_institucion(estado):
    institucion_id = estado.session.info.get("institucion_id")
    if institucion_id is None:
        if traer.APP_ENV == "production" and any(
            issubclass(mapper.class_, EntidadInstitucional)
            for mapper in estado.all_mappers
        ):
            raise RuntimeError("La consulta requiere un contexto de institución.")
        return
    estado.statement = estado.statement.options(
        with_loader_criteria(
            EntidadInstitucional,
            lambda entidad: entidad.institucion_id == institucion_id,
            include_aliases=True,
        )
    )


@event.listens_for(Session, "before_flush")
def validar_institucion_de_cambios(db, flush_context, instances):
    institucion_id = db.info.get("institucion_id")
    for registro in db.new.union(db.dirty).union(db.deleted):
        if not isinstance(registro, EntidadInstitucional):
            continue
        asignada = getattr(registro, "institucion_id", None)
        if asignada is None and institucion_id is not None:
            registro.institucion_id = institucion_id
            asignada = institucion_id
        if asignada is None and traer.APP_ENV != "production":
            registro.institucion_id = 1
            asignada = 1
        if institucion_id is not None and asignada != institucion_id:
            raise ValueError("No se puede escribir un registro de otra institución.")
        if asignada is None and traer.APP_ENV == "production":
            raise ValueError("La operación requiere un contexto de institución.")


def abrir_puerta_bd(request: Request):
    db = llaves()
    try:
        slug = (
            request.headers.get("X-Institution-Slug")
            or request.query_params.get("institucion")
            or traer.DEFAULT_INSTITUTION_SLUG
        ).strip().casefold()
        institucion = db.query(Instituciones).filter(
            Instituciones.slug == slug,
            Instituciones.activa.is_(True),
        ).first()
        if institucion is None:
            raise HTTPException(status_code=404, detail="Institución no encontrada")

        token = request.cookies.get("campusflow_session")
        authorization = request.headers.get("Authorization", "")
        if authorization.lower().startswith("bearer "):
            token = authorization.partition(" ")[2]
        institucion_token = None
        if token:
            try:
                institucion_token = verificar_token(token).get("institucion_id")
            except Exception:
                institucion_token = None
        if institucion_token is not None and institucion_token != institucion.id:
            raise HTTPException(
                status_code=403,
                detail="La sesión no corresponde a esta institución",
            )
        db.info["institucion_id"] = institucion.id
        yield db
    finally:
        db.close()
