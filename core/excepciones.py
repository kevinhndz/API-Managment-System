class SuperPoder(Exception):
    """Excepcion base para todos los errores de la regla de negocio."""
    def __init__(self, mensaje: str):
        self.mensaje = mensaje


class RecursoNoEncontradoError(SuperPoder):
    """Representa HTTP 404 - Registro no encontrado."""
    pass


class RecursoDuplicadoError(SuperPoder):
    """Representa HTTP 409 - Registro duplicado."""
    pass


class CredencialesInvalidasError(SuperPoder):
    """Representa HTTP 401 - Fallo al autenticarse en el login."""
    pass


class AccesoProhibidoError(SuperPoder):
    """Representa HTTP 403 - Permisos insuficientes o token expirado/invalido."""
    pass


class IntentosInicioSesionLimitadosError(SuperPoder):
    """Representa HTTP 429 cuando se supera el limite de inicio de sesion."""

    def __init__(self, segundos_restantes: int):
        super().__init__("Demasiados intentos. Intenta de nuevo mas tarde.")
        self.segundos_restantes = segundos_restantes


class IntentosVerificacionLimitadosError(SuperPoder):
    """Representa HTTP 429 al solicitar o validar codigos de correo."""

    def __init__(self, segundos_restantes: int):
        super().__init__("Demasiados intentos. Espera antes de intentarlo de nuevo.")
        self.segundos_restantes = segundos_restantes


class ServicioCorreoNoDisponibleError(SuperPoder):
    """Representa HTTP 503 cuando no se puede enviar un codigo de correo."""


class VerificacionCorreoInvalidaError(SuperPoder):
    """Representa HTTP 400 cuando el codigo o pase de correo no es valido."""


class ArchivoPerfilInvalidoError(SuperPoder):
    def __init__(self, mensaje: str, codigo_http: int):
        super().__init__(mensaje)
        self.codigo_http = codigo_http


class DatosInvalidosError(SuperPoder):
    """Datos que no cumplen las condiciones de la operacion."""
