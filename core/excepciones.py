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