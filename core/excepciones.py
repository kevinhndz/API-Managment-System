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
