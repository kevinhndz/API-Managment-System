from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from database.almacen import miClaseBase
from database.base import PoderAuditor, fecha_actual_utc_sin_zona


class SolicitudesCuenta(miClaseBase, PoderAuditor):
    __tablename__ = "solicitudes_cuenta"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(160), nullable=False)
    correo = Column(String(150), nullable=False, index=True)
    usuario = Column(String(80), nullable=False, index=True)
    contrasena_hash = Column(String(255), nullable=False)
    estado = Column(String(20), default="PENDIENTE", nullable=False, index=True)
    revisado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    revisado_en = Column(DateTime, nullable=True)


class SolicitudesRecuperacion(miClaseBase):
    __tablename__ = "solicitudes_recuperacion"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False)
    expira_en = Column(DateTime, nullable=False)
    usado_en = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=fecha_actual_utc_sin_zona, nullable=False)
