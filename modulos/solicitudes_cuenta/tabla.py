from sqlalchemy import Column, DateTime, ForeignKeyConstraint, Integer, String, UniqueConstraint

from database.almacen import miClaseBase
from database.base import EntidadInstitucional, PoderAuditor, fecha_actual_utc_sin_zona


class SolicitudesCuenta(miClaseBase, PoderAuditor):
    __tablename__ = "solicitudes_cuenta"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(160), nullable=False)
    correo = Column(String(150), nullable=False, index=True)
    usuario = Column(String(80), nullable=False, index=True)
    contrasena_hash = Column(String(255), nullable=False)
    estado = Column(String(20), default="PENDIENTE", nullable=False, index=True)
    revisado_por = Column(Integer, nullable=True)
    revisado_en = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("institucion_id", "id", name="uq_solicitudes_cuenta_institucion_id"),
        ForeignKeyConstraint(
            ["institucion_id", "revisado_por"],
            ["usuarios.institucion_id", "usuarios.id"],
            name="fk_solicitudes_cuenta_revisor_institucion",
        ),
    )


class SolicitudesRecuperacion(miClaseBase, EntidadInstitucional):
    __tablename__ = "solicitudes_recuperacion"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False)
    expira_en = Column(DateTime, nullable=False)
    usado_en = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=fecha_actual_utc_sin_zona, nullable=False)

    __table_args__ = (
        ForeignKeyConstraint(
            ["institucion_id", "usuario_id"],
            ["usuarios.institucion_id", "usuarios.id"],
            name="fk_solicitudes_recuperacion_usuario_institucion",
        ),
    )


class VerificacionesCorreoSolicitud(miClaseBase, EntidadInstitucional):
    __tablename__ = "verificaciones_correo_solicitud"

    id = Column(String(36), primary_key=True)
    correo = Column(String(150), nullable=False, index=True)
    ip_hash = Column(String(64), nullable=False, index=True)
    codigo_hash = Column(String(64), nullable=False)
    expira_en = Column(DateTime, nullable=False)
    reintentar_desde = Column(DateTime, nullable=False)
    intentos = Column(Integer, default=0, nullable=False)
    ticket_hash = Column(String(64), nullable=True, unique=True)
    ticket_expira_en = Column(DateTime, nullable=True)
    consumido_en = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=fecha_actual_utc_sin_zona, nullable=False)
