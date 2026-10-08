from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from core.excepciones import RecursoDuplicadoError, RecursoNoEncontradoError
from modulos.docentes.tabla import Docentes
from modulos.login.tabla import Usuarios
from modulos.solicitudes_cuenta.schema import AprobarSolicitudCuenta, SolicitudCuentaCrear
from modulos.solicitudes_cuenta.tabla import SolicitudesCuenta
from utils.hash import encriptar_contrasena


def crear_solicitud(db: Session, datos: SolicitudCuentaCrear) -> None:
    correo = str(datos.correo).casefold()
    usuario_existente = db.query(Usuarios).filter(
        (func.lower(Usuarios.usuario) == datos.usuario.strip().casefold())
        | (func.lower(Usuarios.correo) == correo)
    ).first()
    solicitud_pendiente = db.query(SolicitudesCuenta).filter(
        SolicitudesCuenta.estado == "PENDIENTE",
        (func.lower(SolicitudesCuenta.usuario) == datos.usuario.strip().casefold())
        | (func.lower(SolicitudesCuenta.correo) == correo),
    ).first()
    if usuario_existente or solicitud_pendiente:
        raise RecursoDuplicadoError("Ya existe una cuenta o solicitud pendiente con esos datos.")

    db.add(SolicitudesCuenta(
        nombre_completo=datos.nombre_completo.strip(),
        correo=correo,
        usuario=datos.usuario.strip(),
        contrasena_hash=encriptar_contrasena(datos.contrasena),
    ))
    db.commit()


def listar_solicitudes(db: Session) -> list[SolicitudesCuenta]:
    return db.query(SolicitudesCuenta).order_by(
        SolicitudesCuenta.created_at.desc(),
    ).all()


def aprobar_solicitud(
    db: Session,
    solicitud_id: int,
    datos: AprobarSolicitudCuenta,
    administrador_id: int,
) -> SolicitudesCuenta:
    solicitud = db.query(SolicitudesCuenta).filter(
        SolicitudesCuenta.id == solicitud_id,
    ).with_for_update().first()
    if solicitud is None:
        raise RecursoNoEncontradoError("No se encontro la solicitud.")
    if solicitud.estado != "PENDIENTE":
        raise RecursoDuplicadoError("La solicitud ya fue revisada.")

    duplicada = db.query(Usuarios).filter(
        (func.lower(Usuarios.usuario) == solicitud.usuario.casefold())
        | (func.lower(Usuarios.correo) == solicitud.correo.casefold())
    ).first()
    if duplicada:
        raise RecursoDuplicadoError("Ya existe una cuenta con esos datos.")

    docente_id = datos.docente_id
    if datos.docente_nuevo is not None:
        correo_docente_existente = db.query(Docentes.id).filter(
            func.lower(Docentes.correo) == solicitud.correo.casefold(),
        ).first()
        numero_empleado_existente = db.query(Docentes.id).filter(
            func.lower(Docentes.numero_empleado)
            == datos.docente_nuevo.numero_empleado.strip().casefold(),
        ).first()
        if correo_docente_existente or numero_empleado_existente:
            raise RecursoDuplicadoError(
                "Ya existe un docente con ese correo o numero de empleado."
            )

        docente = Docentes(
            numero_empleado=datos.docente_nuevo.numero_empleado.strip(),
            nombres=datos.docente_nuevo.nombres.strip(),
            apellidos=datos.docente_nuevo.apellidos.strip(),
            correo=solicitud.correo,
            especialidad="",
            estado=True,
        )
        db.add(docente)
        db.flush()
        docente_id = docente.id

    if docente_id is not None and db.query(Docentes.id).filter(
        Docentes.id == docente_id,
    ).first() is None:
        raise RecursoNoEncontradoError("No se encontro el docente indicado.")
    if docente_id is not None and db.query(Usuarios.id).filter(
        Usuarios.docente_id == docente_id,
    ).first() is not None:
        raise RecursoDuplicadoError("Ese docente ya tiene una cuenta vinculada.")

    db.add(Usuarios(
        usuario=solicitud.usuario,
        correo=solicitud.correo,
        contrasena=solicitud.contrasena_hash,
        rol=datos.rol,
        docente_id=docente_id,
        activo=True,
    ))
    solicitud.estado = "APROBADA"
    solicitud.contrasena_hash = ""
    solicitud.revisado_por = administrador_id
    solicitud.revisado_en = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(solicitud)
    return solicitud


def rechazar_solicitud(
    db: Session,
    solicitud_id: int,
    administrador_id: int,
) -> SolicitudesCuenta:
    solicitud = db.query(SolicitudesCuenta).filter(
        SolicitudesCuenta.id == solicitud_id,
    ).with_for_update().first()
    if solicitud is None:
        raise RecursoNoEncontradoError("No se encontro la solicitud.")
    if solicitud.estado != "PENDIENTE":
        raise RecursoDuplicadoError("La solicitud ya fue revisada.")

    solicitud.estado = "RECHAZADA"
    solicitud.revisado_por = administrador_id
    solicitud.revisado_en = datetime.now(timezone.utc).replace(tzinfo=None)
    solicitud.contrasena_hash = ""
    db.commit()
    db.refresh(solicitud)
    return solicitud
