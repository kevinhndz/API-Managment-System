from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker, DeclarativeBase
from core.config import preparar_url_base_datos, settings as traer

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


def abrir_puerta_bd():
   
    try:
        db = llaves()  
        yield db       
    finally:
        db.close()
