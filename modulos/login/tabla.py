from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from database.almacen import miClaseBase
from database.base import PoderAuditor


class Usuarios(miClaseBase, PoderAuditor):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    usuario = Column(String(80), unique=True, nullable=False)
    correo = Column(String(150), unique=True, nullable=True)
    contrasena = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)
    docente_id = Column(Integer, ForeignKey("docentes.id"), nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    version_token = Column(Integer, default=0, nullable=False)
