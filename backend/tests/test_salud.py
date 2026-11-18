from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.pool import StaticPool

from core import salud
from database.almacen import Instituciones, abrir_puerta_bd
from main import app


def test_disponibilidad_consulta_tabla_instituciones(monkeypatch):
    motor = create_engine('sqlite://', poolclass=StaticPool, connect_args={'check_same_thread': False})
    Instituciones.__table__.create(motor)
    monkeypatch.setattr(salud, 'motor', motor)
    try:
        with TestClient(app) as cliente:
            respuesta = cliente.get('/health/ready')
            assert respuesta.status_code == 200
            assert respuesta.json() == {'status': 'ok'}
            Instituciones.__table__.drop(motor)
            assert cliente.get('/health/ready').status_code == 503
    finally:
        motor.dispose()


def test_login_y_recuperacion_informan_indisponibilidad_sin_filtrar_secretos():
    def bd_caida():
        raise OperationalError('consulta privada', {}, Exception('credencial privada'))
        yield

    app.dependency_overrides[abrir_puerta_bd] = bd_caida
    try:
        with TestClient(app) as cliente:
            for ruta, datos in [
                ('/login/sesion', {'usuario': 'admin', 'contrasena': 'clave-de-prueba'}),
                ('/login/recuperacion', {'correo': 'admin@example.com'}),
            ]:
                respuesta = cliente.post(ruta, json=datos)
                assert respuesta.status_code == 503
                assert respuesta.json() == {'detail': 'La base de datos no esta disponible. Intenta mas tarde.'}
                assert respuesta.headers['Retry-After'] == '30'
    finally:
        app.dependency_overrides.pop(abrir_puerta_bd, None)
