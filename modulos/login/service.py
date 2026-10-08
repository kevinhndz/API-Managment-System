from sqlalchemy.orm import Session
from core.excepciones import CredencialesInvalidasError, RecursoDuplicadoError
from utils.hash import encriptar_contrasena, verificar_contrasena
from utils.token import crear_token
from modulos.login.repository import UsuarioRepository as repo
from modulos.login.schema import LoginRequest, Revisar_Json_Crear_Usuario
from modulos.login.tabla import Usuarios


class LoginService:
    @staticmethod
    def crear_usuario_service(db: Session, json: Revisar_Json_Crear_Usuario):
        if repo.check_repository(db, json) is not None:
            raise RecursoDuplicadoError("Ya existe este usuario")
        usuario = Usuarios(
            usuario=json.usuario,
            correo=str(json.correo).casefold() if json.correo else None,
            contrasena=encriptar_contrasena(json.contrasena),
            rol=json.rol,
            docente_id=json.docente_id,
            activo=json.activo,
        )
        return repo.guardar_usuario_repository(db, usuario)

    @staticmethod
    def login_service(db: Session, json: LoginRequest):
        usuario = repo.buscar_usuario_repository(db, json.usuario)
        if (
            usuario is None
            or not usuario.activo
            or not verificar_contrasena(json.contrasena, usuario.contrasena)
        ):
            raise CredencialesInvalidasError("Usuario o contraseña incorrectos")
        return crear_token(usuario.usuario, usuario.id, usuario.rol, usuario.version_token)
