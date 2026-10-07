from fastapi.testclient import TestClient
import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database.almacen import abrir_puerta_bd
from modulos.auditoria.tabla import EventoAuditoria
from modulos.aulas.tabla import Aulas
from modulos.login.tabla import Usuarios
from modulos.login.schema import Revisar_Json_Crear_Usuario
from main import app
from utils.hash import encriptar_contrasena
from utils.token import crear_token


def _cliente_con_bd_en_memoria():
    motor = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Aulas.__table__.create(motor)
    EventoAuditoria.__table__.create(motor)
    Usuarios.__table__.create(motor)

    def abrir_bd_prueba():
        with Session(motor) as db:
            yield db

    app.dependency_overrides[abrir_puerta_bd] = abrir_bd_prueba
    return TestClient(app), motor


def test_proteccion_de_rutas_responde_401_sin_sesion_o_con_token_invalido():
    cliente, motor = _cliente_con_bd_en_memoria()

    try:
        sin_sesion = cliente.get("/aulas/")
        token_invalido = cliente.get(
            "/aulas/", headers={"Authorization": "Bearer token-invalido"}
        )

        assert sin_sesion.status_code == 401
        assert token_invalido.status_code == 401
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_cookie_de_sesion_protege_y_registra_la_actividad():
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(id=7, usuario="admin", contrasena="hash", rol="Administrador", activo=True))
        db.commit()
    token = crear_token("admin", 7, "Administrador")
    cliente.cookies.set("campusflow_session", token)

    try:
        respuesta = cliente.post(
            "/aulas/",
            json={
                "codigo": "A-01",
                "edificio": "Edificio Norte",
                "capacidad": 30,
                "activo": True,
            },
        )

        assert respuesta.status_code == 201, respuesta.text
        with Session(motor) as db:
            evento = db.scalars(select(EventoAuditoria)).one()
            assert evento.usuario == "admin"
            assert evento.modulo == "aulas"
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_cerrar_sesion_elimina_la_cookie():
    cliente, motor = _cliente_con_bd_en_memoria()

    try:
        respuesta = cliente.post("/login/cerrar")

        assert respuesta.status_code == 204
        assert "Max-Age=0" in respuesta.headers["set-cookie"]
        assert "HttpOnly" in respuesta.headers["set-cookie"]
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_login_crea_cookie_http_only_y_sigue_aceptando_la_sesion():
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(
            Usuarios(
                usuario="admin-prueba",
                contrasena=encriptar_contrasena("clave-segura-de-prueba"),
                rol="Administrador",
                activo=True,
            )
        )
        db.commit()

    try:
        respuesta = cliente.post(
            "/login/sesion",
            json={
                "usuario": "admin-prueba",
                "contrasena": "clave-segura-de-prueba",
            },
        )

        assert respuesta.status_code == 200
        assert respuesta.json() == {"autenticada": True}
        assert "campusflow_session=" in respuesta.headers["set-cookie"]
        assert "HttpOnly" in respuesta.headers["set-cookie"]
        assert cliente.get("/aulas/").status_code == 200
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_cors_solo_refleja_origenes_configurados():
    cliente, motor = _cliente_con_bd_en_memoria()

    try:
        respuesta = cliente.options(
            "/aulas/",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )

        assert respuesta.status_code == 200
        assert respuesta.headers["access-control-allow-origin"] == "http://localhost:5173"
        assert respuesta.headers["access-control-allow-credentials"] == "true"
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_la_sesion_se_rechaza_si_la_cuenta_se_desactiva():
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(id=7, usuario="admin", contrasena="hash", rol="Administrador", activo=False))
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("admin", 7, "Administrador"))

    try:
        respuesta = cliente.get("/aulas/")
        assert respuesta.status_code == 401
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_usuarios_nuevos_requieren_clave_fuerte_y_rol_canonico():
    usuario = Revisar_Json_Crear_Usuario(
        usuario="admin-nuevo",
        contrasena="clave-segura-de-prueba",
        rol="ADMIN",
    )

    assert usuario.rol == "Administrador"

    with pytest.raises(ValidationError):
        Revisar_Json_Crear_Usuario(
            usuario="admin-nuevo",
            contrasena="corta123",
            rol="Administrador",
        )

    with pytest.raises(ValidationError):
        Revisar_Json_Crear_Usuario(
            usuario="admin-nuevo",
            contrasena="🗝️" * 20,
            rol="Administrador",
        )
