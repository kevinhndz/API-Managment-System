import hashlib
import hmac
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from core.config import settings
from core.excepciones import (
    CredencialesInvalidasError,
    IntentosInicioSesionLimitadosError,
    RecursoDuplicadoError,
    RecursoNoEncontradoError,
)
from utils.hash import encriptar_contrasena, verificar_contrasena
from utils.token import crear_token
from modulos.login.repository import IntentosInicioSesionRepository as intentos_repo
from modulos.login.repository import UsuarioRepository as repo
from modulos.login.schema import LoginRequest, PerfilUsuarioActualizar, Revisar_Json_Crear_Usuario
from modulos.login.tabla import Usuarios


class LoginService:
    @staticmethod
    def actualizar_perfil_service(db: Session, usuario_id: int, json: PerfilUsuarioActualizar):
        registro = repo.buscar_por_id_repository(db, usuario_id)
        if registro is None:
            raise RecursoNoEncontradoError("No se encontro la cuenta.")

        nombre = json.nombre.strip()
        correo = str(json.correo).casefold()
        if repo.buscar_correo_de_otra_cuenta_repository(db, correo, usuario_id):
            raise RecursoDuplicadoError("Ese correo ya esta asociado a otra cuenta.")

        registro.nombre = nombre
        registro.correo = correo
        try:
            return repo.guardar_cambios_perfil_repository(db, registro)
        except IntegrityError as error:
            db.rollback()
            raise RecursoDuplicadoError("Ese correo ya esta asociado a otra cuenta.") from error

    @staticmethod
    def crear_usuario_service(db: Session, json: Revisar_Json_Crear_Usuario):
        if repo.check_repository(db, json) is not None:
            raise RecursoDuplicadoError("Ya existe este usuario")
        usuario = Usuarios(
            usuario=json.usuario,
            nombre=json.usuario,
            correo=str(json.correo).casefold() if json.correo else None,
            contrasena=encriptar_contrasena(json.contrasena),
            rol=json.rol,
            docente_id=json.docente_id,
            activo=json.activo,
        )
        return repo.guardar_usuario_repository(db, usuario)

    @staticmethod
    def login_service(db: Session, json: LoginRequest, direccion_ip: str | None = None):
        ahora = datetime.now(timezone.utc)
        claves_y_limites = LoginService._claves_intentos(json.usuario, direccion_ip)
        claves = [clave for clave, _ in claves_y_limites]
        segundos_restantes = intentos_repo.buscar_bloqueo_repository(db, claves, ahora)
        if segundos_restantes:
            raise IntentosInicioSesionLimitadosError(segundos_restantes)

        usuario = repo.buscar_usuario_repository(db, json.usuario)
        if (
            usuario is None
            or not usuario.activo
            or not verificar_contrasena(json.contrasena, usuario.contrasena)
        ):
            segundos_restantes = intentos_repo.registrar_fallo_repository(
                db,
                claves_y_limites,
                ahora,
                settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS,
                settings.LOGIN_RATE_LIMIT_BASE_LOCK_SECONDS,
                settings.LOGIN_RATE_LIMIT_MAX_LOCK_SECONDS,
            )
            if segundos_restantes:
                raise IntentosInicioSesionLimitadosError(segundos_restantes)
            raise CredencialesInvalidasError("Usuario o contraseña incorrectos")

        intentos_repo.limpiar_intentos_repository(db, [claves_y_limites[0][0]])
        return crear_token(usuario.usuario, usuario.id, usuario.rol, usuario.version_token)

    @staticmethod
    def _claves_intentos(usuario: str, direccion_ip: str | None):
        secreto = settings.SECRET_KEY.encode("utf-8")
        usuario_normalizado = usuario.strip().casefold()
        material_cuenta = f"cuenta-ip:{usuario_normalizado}:{direccion_ip or 'sin-ip'}"
        clave_cuenta = hmac.new(secreto, material_cuenta.encode("utf-8"), hashlib.sha256).hexdigest()
        claves_y_limites = [
            (clave_cuenta, settings.LOGIN_RATE_LIMIT_IDENTITY_ATTEMPTS),
        ]
        if direccion_ip:
            clave_ip = hmac.new(
                secreto,
                f"ip:{direccion_ip}".encode("utf-8"),
                hashlib.sha256,
            ).hexdigest()
            claves_y_limites.append((clave_ip, settings.LOGIN_RATE_LIMIT_IP_ATTEMPTS))
        return claves_y_limites
