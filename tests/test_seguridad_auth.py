from fastapi.testclient import TestClient
import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from urllib.parse import parse_qs, urlparse

from database.almacen import abrir_puerta_bd
from modulos.auditoria.tabla import EventoAuditoria
from modulos.aulas.tabla import Aulas
from modulos.docentes.tabla import Docentes
from modulos.login.tabla import Usuarios
from modulos.login.schema import Revisar_Json_Crear_Usuario
from modulos.solicitudes_cuenta.tabla import SolicitudesCuenta, SolicitudesRecuperacion
from main import app
from utils.hash import encriptar_contrasena
from utils.token import crear_token
from core.config import settings


def test_solicitud_publica_requiere_aprobacion_y_el_admin_asigna_el_rol():
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(id=17, usuario="admin", contrasena="hash", rol="Administrador", activo=True))
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("admin", 17, "Administrador"))

    try:
        solicitud = cliente.post("/solicitudes-cuenta/", json={
            "nombre_completo": "Docente Nuevo",
            "correo": "docente.nuevo@uphn.edu",
            "usuario": "docente.nuevo",
            "contrasena": "clave-segura-de-prueba",
        })
        assert solicitud.status_code == 202
        with Session(motor) as db:
            solicitud_pendiente = db.query(SolicitudesCuenta).one()
            assert solicitud_pendiente.contrasena_hash != "clave-segura-de-prueba"

        acceso_pendiente = cliente.post("/login/sesion", json={
            "usuario": "docente.nuevo",
            "contrasena": "clave-segura-de-prueba",
        })
        assert acceso_pendiente.status_code == 401

        bandeja = cliente.get("/solicitudes-cuenta/")
        assert bandeja.status_code == 200
        solicitud_id = bandeja.json()[0]["id"]
        with Session(motor) as db:
            docente = Docentes(
                numero_empleado="DOC-APROBADO",
                nombres="Docente",
                apellidos="Nuevo",
                correo="docente.nuevo@uphn.edu",
                especialidad="",
                estado=True,
            )
            db.add(docente)
            db.commit()
            docente_id = docente.id
        aprobada = cliente.post(
            f"/solicitudes-cuenta/{solicitud_id}/aprobar",
            json={"rol": "Docente", "docente_id": docente_id},
        )
        assert aprobada.status_code == 200

        acceso_aprobado = cliente.post("/login/sesion", json={
            "usuario": "docente.nuevo",
            "contrasena": "clave-segura-de-prueba",
        })
        assert acceso_aprobado.status_code == 200
        with Session(motor) as db:
            usuario = db.query(Usuarios).filter_by(usuario="docente.nuevo").one()
            assert usuario.rol == "Docente"
            assert usuario.correo == "docente.nuevo@uphn.edu"
            assert usuario.docente_id == docente_id
            solicitud_aprobada = db.query(SolicitudesCuenta).filter_by(id=solicitud_id).one()
            assert solicitud_aprobada.contrasena_hash == ""
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_aprobar_new_hire_crea_docente_y_vincula_la_cuenta_en_una_operacion():
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(id=18, usuario="admin-new-hire", contrasena="hash", rol="Administrador", activo=True))
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("admin-new-hire", 18, "Administrador"))

    try:
        solicitud = cliente.post("/solicitudes-cuenta/", json={
            "nombre_completo": "Ana Maria Nueva",
            "correo": "ana.nueva@uphn.edu",
            "usuario": "ana.nueva",
            "contrasena": "clave-segura-de-prueba",
        })
        assert solicitud.status_code == 202
        solicitud_id = cliente.get("/solicitudes-cuenta/").json()[0]["id"]

        aprobada = cliente.post(
            f"/solicitudes-cuenta/{solicitud_id}/aprobar",
            json={
                "rol": "Docente",
                "docente_nuevo": {
                    "numero_empleado": "DOC-NEW-001",
                    "nombres": "Ana Maria",
                    "apellidos": "Nueva",
                },
            },
        )

        assert aprobada.status_code == 200, aprobada.text
        with Session(motor) as db:
            docente = db.query(Docentes).filter_by(numero_empleado="DOC-NEW-001").one()
            usuario = db.query(Usuarios).filter_by(usuario="ana.nueva").one()
            solicitud_aprobada = db.query(SolicitudesCuenta).filter_by(id=solicitud_id).one()
            assert docente.correo == "ana.nueva@uphn.edu"
            assert docente.nombres == "Ana Maria"
            assert docente.apellidos == "Nueva"
            assert usuario.docente_id == docente.id
            assert solicitud_aprobada.estado == "APROBADA"
            assert solicitud_aprobada.contrasena_hash == ""
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_recuperacion_cambia_clave_usa_token_una_vez_e_invalida_sesion(monkeypatch):
    cliente, motor = _cliente_con_bd_en_memoria()
    correo_enviado = {}
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.prueba")
    monkeypatch.setattr(settings, "SMTP_USER", "usuario")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "clave")
    monkeypatch.setattr(settings, "SMTP_FROM", "campusflow@prueba.test")

    def guardar_correo(destinatario, asunto, contenido):
        correo_enviado.update(destinatario=destinatario, asunto=asunto, contenido=contenido)

    monkeypatch.setattr("modulos.login.recuperacion.enviar_correo", guardar_correo)
    with Session(motor) as db:
        db.add(Usuarios(
            id=21,
            usuario="admin-recuperacion",
            correo="admin.recuperacion@uphn.edu",
            contrasena=encriptar_contrasena("clave-anterior-segura"),
            rol="Administrador",
            activo=True,
        ))
        db.commit()
    cliente.cookies.set(
        "campusflow_session",
        crear_token("admin-recuperacion", 21, "Administrador"),
    )

    try:
        respuesta = cliente.post("/login/recuperacion", json={"correo": "admin.recuperacion@uphn.edu"})
        assert respuesta.status_code == 202
        assert respuesta.json()["detail"] == "Si existe una cuenta con ese correo, recibira instrucciones."
        token = parse_qs(urlparse(correo_enviado["contenido"].splitlines()[2]).query)["token"][0]

        cambio = cliente.post("/login/recuperacion/confirmar", json={
            "token": token,
            "contrasena": "clave-nueva-segura-2026",
        })
        assert cambio.status_code == 200
        assert cliente.get("/aulas/").status_code == 401

        token_reutilizado = cliente.post("/login/recuperacion/confirmar", json={
            "token": token,
            "contrasena": "otra-clave-segura-2026",
        })
        assert token_reutilizado.status_code == 401

        login_nuevo = cliente.post("/login/sesion", json={
            "usuario": "admin-recuperacion",
            "contrasena": "clave-nueva-segura-2026",
        })
        assert login_nuevo.status_code == 200
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def _cliente_con_bd_en_memoria():
    motor = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Aulas.__table__.create(motor)
    Docentes.__table__.create(motor)
    EventoAuditoria.__table__.create(motor)
    Usuarios.__table__.create(motor)
    SolicitudesCuenta.__table__.create(motor)
    SolicitudesRecuperacion.__table__.create(motor)

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
