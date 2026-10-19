from datetime import datetime, timedelta, timezone
import re
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
from modulos.login.tabla import IntentosInicioSesion, Usuarios
from modulos.login.schema import Revisar_Json_Crear_Usuario
from modulos.solicitudes_cuenta.tabla import (
    SolicitudesCuenta,
    SolicitudesRecuperacion,
    VerificacionesCorreoSolicitud,
)
from main import app
from utils.hash import encriptar_contrasena
from utils.token import crear_token
from core.config import settings


def test_solicitud_publica_requiere_aprobacion_y_el_admin_asigna_el_rol(monkeypatch):
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(id=17, usuario="admin", contrasena="hash", rol="Administrador", activo=True))
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("admin", 17, "Administrador"))

    try:
        ticket = _solicitar_y_verificar_correo(cliente, monkeypatch, "docente.nuevo@uphn.edu")
        solicitud = cliente.post("/solicitudes-cuenta/", json={
            "nombre_completo": "Docente Nuevo",
            "correo": "docente.nuevo@uphn.edu",
            "usuario": "docente.nuevo",
            "contrasena": "clave-segura-de-prueba",
            "ticket_verificacion": ticket,
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
            assert usuario.nombre == "Docente Nuevo"
            assert usuario.correo == "docente.nuevo@uphn.edu"
            assert usuario.docente_id == docente_id
            solicitud_aprobada = db.query(SolicitudesCuenta).filter_by(id=solicitud_id).one()
            assert solicitud_aprobada.contrasena_hash == ""
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_aprobar_new_hire_crea_docente_y_vincula_la_cuenta_en_una_operacion(monkeypatch):
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(id=18, usuario="admin-new-hire", contrasena="hash", rol="Administrador", activo=True))
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("admin-new-hire", 18, "Administrador"))

    try:
        ticket = _solicitar_y_verificar_correo(cliente, monkeypatch, "ana.nueva@uphn.edu")
        solicitud = cliente.post("/solicitudes-cuenta/", json={
            "nombre_completo": "Ana Maria Nueva",
            "correo": "ana.nueva@uphn.edu",
            "usuario": "ana.nueva",
            "contrasena": "clave-segura-de-prueba",
            "ticket_verificacion": ticket,
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


def test_perfil_actualiza_solo_la_cuenta_autenticada_y_sus_datos_personales():
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add_all([
            Usuarios(id=31, usuario="admin-perfil", correo="admin@uphn.edu", contrasena="hash", rol="Administrador", activo=True),
            Usuarios(id=32, usuario="otra-cuenta", correo="otra@uphn.edu", contrasena="hash", rol="Docente", activo=True),
        ])
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("admin-perfil", 31, "Administrador"))

    try:
        respuesta = cliente.patch("/login/perfil", json={
            "nombre": "  Kevin Hernandez  ",
            "correo": "KEVIN@UPHN.EDU",
        })

        assert respuesta.status_code == 200, respuesta.text
        assert respuesta.json() == {"nombre": "Kevin Hernandez", "correo": "kevin@uphn.edu", "foto": None}
        with Session(motor) as db:
            cuenta = db.query(Usuarios).filter_by(id=31).one()
            otra = db.query(Usuarios).filter_by(id=32).one()
            assert (cuenta.usuario, cuenta.nombre, cuenta.correo, cuenta.rol) == ("admin-perfil", "Kevin Hernandez", "kevin@uphn.edu", "Administrador")
            assert (otra.usuario, otra.correo, otra.rol) == ("otra-cuenta", "otra@uphn.edu", "Docente")
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_usuario_subir_foto_de_perfil_guarda_ruta_y_archivo(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOADS_DIR", str(tmp_path))
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(id=53, usuario="perfil-foto", correo="foto@uphn.edu", contrasena="hash", rol="Administrador", activo=True))
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("perfil-foto", 53, "Administrador"))

    try:
        respuesta = cliente.put(
            "/login/perfil/foto",
            content=b"\xff\xd8\xffdatos-jpeg",
            headers={"content-type": "image/jpeg"},
        )
        assert respuesta.status_code == 200, respuesta.text
        foto = respuesta.json()["foto"]
        assert foto.startswith("/uploads/profiles/") and foto.endswith(".jpg")
        assert (tmp_path / "profiles" / foto.rsplit("/", 1)[-1]).read_bytes() == b"\xff\xd8\xffdatos-jpeg"
        with Session(motor) as db:
            assert db.query(Usuarios).filter_by(id=53).one().foto == foto
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


@pytest.mark.parametrize("tipo,contenido,encabezados,codigo", [
    ("text/html", b"<p>imagen falsa</p>", {}, 415),
    ("image/jpeg", b"", {}, 400),
    ("image/png", b"imagen falsa", {}, 415),
    ("image/webp", b"RIFF0000FALSO", {}, 415),
    ("image/jpeg", b"\xff\xd8\xffimagen", {"content-length": "incorrecto"}, 400),
    ("image/jpeg", b"\xff\xd8\xffimagen", {"content-length": str(5 * 1024 * 1024 + 1)}, 413),
])
def test_foto_invalida_conserva_error_y_no_escribe_archivos(tmp_path, monkeypatch, tipo, contenido, encabezados, codigo):
    monkeypatch.setattr(settings, "UPLOADS_DIR", str(tmp_path))
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(id=53, usuario="perfil-foto", contrasena="hash", rol="Administrador", activo=True))
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("perfil-foto", 53, "Administrador"))
    try:
        respuesta = cliente.put(
            "/login/perfil/foto", content=contenido,
            headers={"content-type": tipo, **encabezados},
        )
        assert respuesta.status_code == codigo, respuesta.text
        assert "detail" in respuesta.json()
        assert list(tmp_path.rglob("*")) == []
        with Session(motor) as db:
            assert db.get(Usuarios, 53).foto is None
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_foto_nueva_se_elimina_si_falla_la_base_y_se_conserva_la_anterior(tmp_path, monkeypatch):
    from modulos.login.repository import UsuarioRepository

    monkeypatch.setattr(settings, "UPLOADS_DIR", str(tmp_path))
    carpeta = tmp_path / "profiles"
    carpeta.mkdir()
    anterior = carpeta / "anterior.jpg"
    anterior.write_bytes(b"foto anterior")
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(
            id=53, usuario="perfil-foto", contrasena="hash", rol="Administrador",
            activo=True, foto="/uploads/profiles/anterior.jpg",
        ))
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("perfil-foto", 53, "Administrador"))

    def fallar_guardado(db, registro):
        raise RuntimeError("Fallo de prueba al guardar")

    monkeypatch.setattr(UsuarioRepository, "guardar_cambios_perfil_repository", fallar_guardado)
    try:
        with pytest.raises(RuntimeError, match="Fallo de prueba"):
            cliente.put("/login/perfil/foto", content=b"\xff\xd8\xffimagen", headers={"content-type": "image/jpeg"})
        assert list(carpeta.iterdir()) == [anterior]
        assert anterior.read_bytes() == b"foto anterior"
        with Session(motor) as db:
            assert db.get(Usuarios, 53).foto == "/uploads/profiles/anterior.jpg"
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_usuario_sin_correo_puede_subir_foto_de_perfil(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "UPLOADS_DIR", str(tmp_path))
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(id=54, usuario="perfil-sin-correo", correo=None, contrasena="hash", rol="Administrador", activo=True))
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("perfil-sin-correo", 54, "Administrador"))

    try:
        respuesta = cliente.put(
            "/login/perfil/foto",
            content=b"\xff\xd8\xffdatos-jpeg",
            headers={"content-type": "image/jpeg"},
        )
        assert respuesta.status_code == 200, respuesta.text
        assert respuesta.json()["correo"] is None
        foto = respuesta.json()["foto"]
        assert foto.startswith("/uploads/profiles/")
        with Session(motor) as db:
            assert db.query(Usuarios).filter_by(id=54).one().foto == foto
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_perfil_rechaza_correo_de_otra_cuenta_y_sesion_ausente():
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add_all([
            Usuarios(id=41, usuario="admin-perfil", correo="admin@uphn.edu", contrasena="hash", rol="Administrador", activo=True),
            Usuarios(id=42, usuario="otra-cuenta", correo="otra@uphn.edu", contrasena="hash", rol="Docente", activo=True),
        ])
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("admin-perfil", 41, "Administrador"))

    try:
        conflicto = cliente.patch("/login/perfil", json={"nombre": "Nuevo Admin", "correo": "OTRA@UPHN.EDU"})
        assert conflicto.status_code == 409

        cliente.cookies.clear()
        sin_sesion = cliente.patch("/login/perfil", json={"nombre": "Nuevo Admin", "correo": "nuevo@uphn.edu"})
        assert sin_sesion.status_code == 401
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_login_limita_intentos_con_espera_y_no_bloquea_otras_cuentas():
    cliente, motor = _cliente_con_bd_en_memoria()

    try:
        for _ in range(4):
            respuesta = cliente.post("/login/sesion", json={
                "usuario": "cuenta-inexistente",
                "contrasena": "incorrecta",
            })
            assert respuesta.status_code == 401
            assert respuesta.json()["detail"] == "Usuario o contraseña incorrectos"

        limite = cliente.post("/login/sesion", json={
            "usuario": "cuenta-inexistente",
            "contrasena": "incorrecta",
        })
        assert limite.status_code == 429
        assert int(limite.headers["retry-after"]) > 0
        assert limite.json()["detail"] == "Demasiados intentos. Intenta de nuevo mas tarde."

        otra_cuenta = cliente.post("/login/sesion", json={
            "usuario": "otra-cuenta",
            "contrasena": "incorrecta",
        })
        assert otra_cuenta.status_code == 401
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_login_correcto_limpia_contador_de_cuenta_y_conserva_el_de_ip():
    cliente, motor = _cliente_con_bd_en_memoria()
    contrasena = "clave-correcta-de-prueba"
    with Session(motor) as db:
        db.add(Usuarios(
            usuario="admin-rate-limit",
            contrasena=encriptar_contrasena(contrasena),
            rol="Administrador",
            activo=True,
        ))
        db.commit()

    try:
        for _ in range(4):
            cliente.post("/login/sesion", json={
                "usuario": "admin-rate-limit",
                "contrasena": "clave-incorrecta",
            })

        ahora_pasado = datetime.now(timezone.utc) - timedelta(seconds=1)
        with Session(motor) as db:
            db.query(IntentosInicioSesion).update({
                IntentosInicioSesion.bloqueado_hasta: ahora_pasado,
            })
            db.commit()

        acceso = cliente.post("/login/sesion", json={
            "usuario": "admin-rate-limit",
            "contrasena": contrasena,
        })

        assert acceso.status_code == 200
        with Session(motor) as db:
            assert db.query(IntentosInicioSesion).count() == 1
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
    IntentosInicioSesion.__table__.create(motor)
    SolicitudesCuenta.__table__.create(motor)
    SolicitudesRecuperacion.__table__.create(motor)
    VerificacionesCorreoSolicitud.__table__.create(motor)

    def abrir_bd_prueba():
        with Session(motor) as db:
            yield db

    app.dependency_overrides[abrir_puerta_bd] = abrir_bd_prueba
    cliente = TestClient(app, headers={"X-CSRF-Token": "token-csrf-pruebas"})
    cliente.cookies.set("campusflow_csrf", "token-csrf-pruebas")
    return cliente, motor


def _solicitar_y_verificar_correo(cliente, monkeypatch, correo):
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.prueba")
    monkeypatch.setattr(settings, "SMTP_USER", "usuario")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "clave")
    monkeypatch.setattr(settings, "SMTP_FROM", "campusflow@prueba.test")
    mensaje = {}

    def guardar_correo(destinatario, asunto, contenido):
        mensaje.update(destinatario=destinatario, asunto=asunto, contenido=contenido)

    monkeypatch.setattr("modulos.solicitudes_cuenta.service.enviar_correo", guardar_correo)
    respuesta_codigo = cliente.post("/solicitudes-cuenta/verificacion", json={"correo": correo})
    assert respuesta_codigo.status_code == 202, respuesta_codigo.text
    codigo = re.search(r"\b(\d{6})\b", mensaje["contenido"]).group(1)
    respuesta_validacion = cliente.post(
        "/solicitudes-cuenta/verificacion/confirmar",
        json={"verificacion_id": respuesta_codigo.json()["verificacion_id"], "codigo": codigo},
    )
    assert respuesta_validacion.status_code == 200, respuesta_validacion.text
    return respuesta_validacion.json()["ticket_verificacion"]


def test_solicitud_cuenta_exige_verificacion_de_correo_y_ticket_de_un_solo_uso(monkeypatch):
    cliente, motor = _cliente_con_bd_en_memoria()
    correo = "solicitante@uphn.edu"
    datos = {
        "nombre_completo": "Solicitante de Prueba",
        "correo": correo,
        "usuario": "solicitante.prueba",
        "contrasena": "clave-segura-de-prueba",
    }

    try:
        sin_verificacion = cliente.post("/solicitudes-cuenta/", json=datos)
        assert sin_verificacion.status_code == 422
        with Session(motor) as db:
            assert db.query(SolicitudesCuenta).count() == 0

        ticket = _solicitar_y_verificar_correo(cliente, monkeypatch, correo)
        datos["ticket_verificacion"] = ticket
        solicitud = cliente.post("/solicitudes-cuenta/", json=datos)
        assert solicitud.status_code == 202, solicitud.text

        ticket_reutilizado = cliente.post("/solicitudes-cuenta/", json=datos)
        assert ticket_reutilizado.status_code == 400
        with Session(motor) as db:
            assert db.query(SolicitudesCuenta).count() == 1
            verificacion = db.query(VerificacionesCorreoSolicitud).one()
            assert verificacion.codigo_hash == ""
            assert verificacion.consumido_en is not None
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_codigo_de_correo_limita_intentos_y_reenvios(monkeypatch):
    cliente, motor = _cliente_con_bd_en_memoria()
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.prueba")
    monkeypatch.setattr(settings, "SMTP_USER", "usuario")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "clave")
    monkeypatch.setattr(settings, "SMTP_FROM", "campusflow@prueba.test")
    correo_enviado = {}
    monkeypatch.setattr(
        "modulos.solicitudes_cuenta.service.enviar_correo",
        lambda destinatario, asunto, contenido: correo_enviado.update(contenido=contenido),
    )

    try:
        emision = cliente.post(
            "/solicitudes-cuenta/verificacion",
            json={"correo": "limites@uphn.edu"},
        )
        assert emision.status_code == 202
        verificacion_id = emision.json()["verificacion_id"]
        codigo_real = re.search(r"\b(\d{6})\b", correo_enviado["contenido"]).group(1)
        codigo_incorrecto = "000001" if codigo_real == "000000" else "000000"
        for _ in range(settings.SIGNUP_EMAIL_CODE_MAX_ATTEMPTS):
            incorrecto = cliente.post(
                "/solicitudes-cuenta/verificacion/confirmar",
                json={"verificacion_id": verificacion_id, "codigo": codigo_incorrecto},
            )
        assert incorrecto.status_code == 429

        reenvio = cliente.post(
            "/solicitudes-cuenta/verificacion",
            json={"correo": "limites@uphn.edu"},
        )
        assert reenvio.status_code == 429
        assert int(reenvio.headers["retry-after"]) > 0
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_csrf_exige_token_valido_para_cambios_con_sesion():
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(id=91, usuario="admin-csrf", contrasena="hash", rol="Administrador", activo=True))
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("admin-csrf", 91, "Administrador"))

    try:
        token = cliente.get("/login/csrf")
        assert token.status_code == 200
        assert token.json()["csrf_token"] == "token-csrf-pruebas"
        assert "httponly" in token.headers["set-cookie"].lower()

        rechazado = cliente.post("/login/cerrar", headers={"X-CSRF-Token": "incorrecto"})
        assert rechazado.status_code == 403

        cerrado = cliente.post("/login/cerrar")
        assert cerrado.status_code == 204
        assert 'campusflow_session=""' in cerrado.headers["set-cookie"]
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_csrf_rechaza_origen_no_autorizado():
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(id=92, usuario="admin-origen", contrasena="hash", rol="Administrador", activo=True))
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("admin-origen", 92, "Administrador"))

    try:
        respuesta = cliente.post("/login/cerrar", headers={"Origin": "https://sitio-ajeno.example"})
        assert respuesta.status_code == 403
        assert respuesta.json()["detail"] == "Origen no permitido."
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_solicitud_de_navegador_necesita_token_csrf_aunque_no_haya_sesion():
    cliente, motor = _cliente_con_bd_en_memoria()

    try:
        respuesta = cliente.post(
            "/login/recuperacion",
            json={"correo": "persona@uphn.edu"},
            headers={"Origin": "http://localhost:5173", "X-CSRF-Token": ""},
        )
        assert respuesta.status_code == 403
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_origen_autorizado_y_token_csrf_pueden_enviar_solicitud_de_navegador():
    cliente, motor = _cliente_con_bd_en_memoria()

    try:
        respuesta = cliente.post(
            "/login/recuperacion",
            json={"correo": "persona@uphn.edu"},
            headers={"Origin": "http://localhost:5173"},
        )
        assert respuesta.status_code == 202
        assert respuesta.headers["access-control-allow-origin"] == "http://localhost:5173"
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_registro_publico_limita_solicitudes_por_ip():
    cliente, motor = _cliente_con_bd_en_memoria()
    datos = {
        "nombre_completo": "Persona de Prueba",
        "correo": "persona@uphn.edu",
        "usuario": "persona.prueba",
        "contrasena": "clave-segura-de-prueba",
        "ticket_verificacion": "ticket-falso-que-no-es-valido-y-tiene-longitud-suficiente",
    }

    try:
        for _ in range(settings.SIGNUP_RATE_LIMIT_IP_ATTEMPTS - 1):
            respuesta = cliente.post("/solicitudes-cuenta/", json=datos)
            assert respuesta.status_code == 400

        limitado = cliente.post("/solicitudes-cuenta/", json=datos)
        assert limitado.status_code == 429
        assert int(limitado.headers["retry-after"]) > 0
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_recuperacion_limita_envios_por_ip():
    cliente, motor = _cliente_con_bd_en_memoria()

    try:
        for _ in range(settings.RECOVERY_REQUEST_RATE_LIMIT_IP_ATTEMPTS - 1):
            respuesta = cliente.post("/login/recuperacion", json={"correo": "alguien@uphn.edu"})
            assert respuesta.status_code == 202

        limitado = cliente.post("/login/recuperacion", json={"correo": "alguien@uphn.edu"})
        assert limitado.status_code == 429
        assert int(limitado.headers["retry-after"]) > 0
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_recuperacion_limita_intentos_de_confirmacion_por_ip():
    cliente, motor = _cliente_con_bd_en_memoria()
    datos = {"token": "token-falso-de-recuperacion-suficientemente-largo", "contrasena": "clave-nueva-segura"}

    try:
        for _ in range(settings.RECOVERY_CONFIRM_RATE_LIMIT_IP_ATTEMPTS - 1):
            respuesta = cliente.post("/login/recuperacion/confirmar", json=datos)
            assert respuesta.status_code == 401

        limitado = cliente.post("/login/recuperacion/confirmar", json=datos)
        assert limitado.status_code == 429
        assert int(limitado.headers["retry-after"]) > 0
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


def test_usuario_docente_no_puede_entrar_a_bandeja_administrativa():
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(id=93, usuario="docente-seguridad", contrasena="hash", rol="Docente", activo=True))
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("docente-seguridad", 93, "Docente"))

    try:
        respuesta = cliente.get("/solicitudes-cuenta/")
        assert respuesta.status_code == 403
    finally:
        app.dependency_overrides.clear()
        cliente.close()
        motor.dispose()


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


def test_busqueda_de_actividad_trata_el_texto_del_usuario_como_dato():
    cliente, motor = _cliente_con_bd_en_memoria()
    with Session(motor) as db:
        db.add(Usuarios(id=81, usuario="admin-sql", contrasena="hash", rol="Administrador", activo=True))
        db.add_all([
            EventoAuditoria(usuario_id=81, usuario="admin-sql", accion="CREAR", modulo="aulas", descripcion="Aula creada"),
            EventoAuditoria(usuario_id=81, usuario="docente", accion="EDITAR", modulo="aulas", descripcion="Aula editada"),
        ])
        db.commit()
    cliente.cookies.set("campusflow_session", crear_token("admin-sql", 81, "Administrador"))

    try:
        respuesta = cliente.get("/auditoria/", params={"usuario": "' OR 1=1 --"})

        assert respuesta.status_code == 200
        assert respuesta.json() == []
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
