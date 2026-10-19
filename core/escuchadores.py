from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from core.excepciones import (
    RecursoNoEncontradoError, 
    RecursoDuplicadoError,
    CredencialesInvalidasError,
    AccesoProhibidoError,
    IntentosInicioSesionLimitadosError,
    IntentosVerificacionLimitadosError,
    ServicioCorreoNoDisponibleError,
    VerificacionCorreoInvalidaError,
    ArchivoPerfilInvalidoError,
    DatosInvalidosError,
)


class ExcepcionesGlobales:

    @staticmethod
    def recurso_no_encontrado(request: Request, exc: RecursoNoEncontradoError):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": exc.mensaje}
        )

    @staticmethod
    def recurso_duplicado(request: Request, exc: RecursoDuplicadoError):
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": exc.mensaje}
        )

    @staticmethod
    def credenciales_invalidas(request: Request, exc: CredencialesInvalidasError):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": exc.mensaje}
        )

    @staticmethod
    def acceso_prohibido(request: Request, exc: AccesoProhibidoError):
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": exc.mensaje}
        )

    @staticmethod
    def intentos_inicio_sesion_limitados(request: Request, exc: IntentosInicioSesionLimitadosError):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": exc.mensaje},
            headers={"Retry-After": str(exc.segundos_restantes)},
        )

    @staticmethod
    def intentos_verificacion_limitados(request: Request, exc: IntentosVerificacionLimitadosError):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": exc.mensaje},
            headers={"Retry-After": str(exc.segundos_restantes)},
        )

    @staticmethod
    def servicio_correo_no_disponible(request: Request, exc: ServicioCorreoNoDisponibleError):
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": exc.mensaje},
        )

    @staticmethod
    def verificacion_correo_invalida(request: Request, exc: VerificacionCorreoInvalidaError):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": exc.mensaje},
        )

    @classmethod
    def directorio(cls, app: FastAPI) -> None:
        app.add_exception_handler(ArchivoPerfilInvalidoError, cls.archivo_perfil_invalido)
        app.add_exception_handler(DatosInvalidosError, cls.datos_invalidos)
        app.add_exception_handler(RecursoNoEncontradoError, cls.recurso_no_encontrado)
        app.add_exception_handler(RecursoDuplicadoError, cls.recurso_duplicado)
        app.add_exception_handler(CredencialesInvalidasError, cls.credenciales_invalidas)
        app.add_exception_handler(AccesoProhibidoError, cls.acceso_prohibido)
        app.add_exception_handler(IntentosInicioSesionLimitadosError, cls.intentos_inicio_sesion_limitados)
        app.add_exception_handler(IntentosVerificacionLimitadosError, cls.intentos_verificacion_limitados)
        app.add_exception_handler(ServicioCorreoNoDisponibleError, cls.servicio_correo_no_disponible)
        app.add_exception_handler(VerificacionCorreoInvalidaError, cls.verificacion_correo_invalida)

    @staticmethod
    def archivo_perfil_invalido(request: Request, exc: ArchivoPerfilInvalidoError):
        return JSONResponse(status_code=exc.codigo_http, content={"detail": exc.mensaje})

    @staticmethod
    def datos_invalidos(request: Request, exc: DatosInvalidosError):
        return JSONResponse(status_code=422, content={"detail": exc.mensaje})
        
"""Cuando se lanza un error(se instacia la clase mejor dicho) FAST API revisa en  escuchadores
        y pregunta ¿Tengo registrado 'AccesoProhibidoError'? ──► 
        si La función es 'cls.acceso_prohibido , y esa función le envía la respuesta de error limpia
        (JSONResponse) al cliente.'"""
