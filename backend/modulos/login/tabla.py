from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKeyConstraint, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from database.almacen import miClaseBase
from database.base import PoderAuditor


class Usuarios(miClaseBase, PoderAuditor):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    usuario = Column(String(80), nullable=False)
    nombre = Column(String(160), nullable=True)
    correo = Column(String(150), nullable=True)
    foto = Column(String(500), nullable=True)
    contrasena = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)
    docente_id = Column(Integer, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    propietario = Column(Boolean, default=False, nullable=False)
    estudiante_id = Column(Integer, nullable=True)
    version_token = Column(Integer, default=0, nullable=False)

    __table_args__ = (
        UniqueConstraint("institucion_id", "usuario", name="uq_usuarios_institucion_usuario"),
        UniqueConstraint("institucion_id", "correo", name="uq_usuarios_institucion_correo"),
        UniqueConstraint("institucion_id", "id", name="uq_usuarios_institucion_id"),
        ForeignKeyConstraint(
            ["institucion_id", "docente_id"],
            ["docentes.institucion_id", "docentes.id"],
            name="fk_usuarios_docente_institucion",
        ),
        ForeignKeyConstraint(
            ["institucion_id", "estudiante_id"],
            ["estudiantes.institucion_id", "estudiantes.id"],
            name="fk_usuarios_estudiante_institucion",
        ),
    )


class IntentosInicioSesion(miClaseBase):
    __tablename__ = "intentos_inicio_sesion"

    clave_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    intentos: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    nivel_bloqueo: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    inicio_ventana: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    bloqueado_hasta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("ix_intentos_inicio_sesion_actualizado_en", "actualizado_en"),
    )
