import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from core.config import settings
from database.almacen import Instituciones, abrir_puerta_bd, miClaseBase
from main import app
from modulos.login.tabla import Usuarios
from modulos.suscripciones import paddle
from modulos.suscripciones.tabla import Suscripciones
from utils.token import crear_token


PRECIO = 'pri_' + 'a' * 26


@pytest.fixture
def checkout(monkeypatch):
    motor = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    miClaseBase.metadata.create_all(motor)
    ahora = datetime.now(timezone.utc)
    with Session(motor) as db:
        db.add_all([Instituciones(id=1, slug='uphn', nombre='Universidad', activa=True),
                    Instituciones(id=2, slug='otra', nombre='Otra universidad', activa=True)])
        db.info['institucion_id'] = 1
        db.add_all([Usuarios(id=1, usuario='admin', rol='Administrador', activo=True, contrasena='hash'),
                    Usuarios(id=2, usuario='docente', rol='Docente', activo=True, contrasena='hash'),
                    Suscripciones(plan='PILOTO', estado='PRUEBA', inicia_en=ahora-timedelta(days=40), vence_en=ahora-timedelta(days=10))])
        db.commit()
    def abrir_prueba():
        with Session(motor) as db:
            db.info['institucion_id'] = 1
            yield db
    app.dependency_overrides[abrir_puerta_bd] = abrir_prueba
    monkeypatch.setattr('modulos.suscripciones.payments_router.llaves', lambda: Session(motor))
    monkeypatch.setattr(settings, 'PADDLE_CLIENT_TOKEN', 'test_' + 'a' * 27)
    monkeypatch.setattr(settings, 'PADDLE_ENVIRONMENT', 'sandbox')
    monkeypatch.setattr(settings, 'PADDLE_PRICE_ID', PRECIO)
    monkeypatch.setattr(settings, 'PADDLE_PLANS', '')
    monkeypatch.setattr(settings, 'PADDLE_WEBHOOK_SECRET', SecretStr('firma-prueba'))
    llamadas = []
    transaccion = {'id': 'txn_checkout', 'status': 'draft'}
    def api(metodo, ruta, payload=None, params=None):
        llamadas.append((metodo, ruta, payload))
        if ruta.startswith('/prices/'):
            return {'status': 'active', 'billing_cycle': {'interval': 'month', 'frequency': 1}}
        return transaccion.copy()
    monkeypatch.setattr(paddle, '_api', api)
    with TestClient(app, headers={'X-CSRF-Token': 'csrf'}) as cliente:
        cliente.cookies.set('campusflow_csrf', 'csrf')
        cliente.cookies.set('campusflow_session', crear_token('admin', 1, 'Administrador'))
        yield cliente, motor, llamadas, transaccion
    app.dependency_overrides.clear()
    motor.dispose()


def enviar_evento(cliente, evento, firma_valida=True):
    cuerpo = json.dumps(evento).encode()
    marca = str(int(time.time()))
    firma = hmac.new(b'firma-prueba', marca.encode()+b':'+cuerpo, hashlib.sha256).hexdigest()
    return cliente.post('/payments/paddle/webhook', content=cuerpo,
                        headers={'Paddle-Signature': f'ts={marca};h1={firma if firma_valida else "invalida"}'})


def evento_creado(transaccion='txn_checkout', sub='sub_nueva', event_id='evt_nuevo'):
    ahora = datetime.now(timezone.utc)
    return {'event_id': event_id, 'event_type': 'subscription.created', 'occurred_at': ahora.isoformat(),
            'data': {'id': sub, 'transaction_id': transaccion, 'custom_data': {'institucion_id': '1'},
                     'status': 'active', 'customer_id': 'ctm_cliente', 'items': [{'price': {'id': PRECIO}}],
                     'current_billing_period': {'starts_at': ahora.isoformat(), 'ends_at': (ahora+timedelta(days=30)).isoformat()}}}


def test_checkout_reutiliza_transaccion_y_solo_webhook_firmado_activa(checkout):
    cliente, motor, llamadas, _ = checkout
    for _ in range(2):
        respuesta = cliente.post('/payments/checkout', json={'plan': 'Institucional', 'institucion_id': 2})
        assert respuesta.status_code == 200, respuesta.text
        assert respuesta.json()['transaction_id'] == 'txn_checkout'
    creaciones = [llamada for llamada in llamadas if llamada[0] == 'POST']
    assert len(creaciones) == 1
    assert creaciones[0][2]['custom_data'] == {'institucion_id': '1'}
    assert cliente.get('/payments/subscription').json()['active'] is False
    assert enviar_evento(cliente, evento_creado(), firma_valida=False).status_code == 401
    assert enviar_evento(cliente, evento_creado(transaccion='txn_ajena')).status_code == 409
    assert enviar_evento(cliente, evento_creado()).status_code == 200
    estado = cliente.get('/payments/subscription').json()
    assert estado['active'] is True
    assert estado['has_paddle_subscription'] is True
    assert estado['plan_name'] == 'Institucional'
    assert enviar_evento(cliente, evento_creado()).json() == {'procesado': False}
    assert cliente.post('/payments/checkout', json={'plan': 'Institucional'}).status_code == 409
    with Session(motor) as db:
        db.info['institucion_id'] = 2
        assert db.query(Suscripciones).count() == 0


def test_checkout_rechaza_usuario_sin_permiso_plan_ajeno_y_configuracion_incompleta(checkout, monkeypatch):
    cliente, _, llamadas, _ = checkout
    cliente.cookies.set('campusflow_session', crear_token('docente', 2, 'Docente'))
    assert cliente.post('/payments/checkout', json={'plan': 'Institucional'}).status_code == 403
    cliente.cookies.clear()
    assert cliente.post('/payments/checkout', json={'plan': 'Institucional'}).status_code == 401
    cliente.cookies.set('campusflow_session', crear_token('admin', 1, 'Administrador'))
    cliente.cookies.set('campusflow_csrf', 'csrf')
    assert cliente.post('/payments/checkout', json={'plan': 'Inventado'}).status_code == 422
    monkeypatch.setattr(settings, 'PADDLE_WEBHOOK_SECRET', SecretStr(''))
    assert cliente.post('/payments/checkout', json={'plan': 'Institucional'}).status_code == 503
    assert llamadas == []


def test_checkout_pagado_no_crea_otro_cobro(checkout):
    cliente, _, llamadas, transaccion = checkout
    assert cliente.post('/payments/checkout', json={'plan': 'Institucional'}).status_code == 200
    transaccion['status'] = 'completed'
    assert cliente.post('/payments/checkout', json={'plan': 'Institucional'}).status_code == 409
    assert len([llamada for llamada in llamadas if llamada[0] == 'POST']) == 1


def test_institucion_cancelada_puede_contratar_otro_mes(checkout):
    cliente, motor, _, transaccion = checkout
    with Session(motor) as db:
        db.info['institucion_id'] = 1
        suscripcion = db.query(Suscripciones).one()
        suscripcion.estado = 'CANCELADA'
        suscripcion.paddle_subscription_id = 'sub_anterior'
        suscripcion.paddle_transaction_id = 'txn_anterior'
        db.commit()
    transaccion.update(status='completed', subscription_id='sub_anterior')
    assert cliente.post('/payments/checkout', json={'plan': 'Institucional'}).status_code == 200
    assert enviar_evento(cliente, evento_creado()).status_code == 200
    assert cliente.get('/payments/subscription').json()['active'] is True


def test_institucion_sin_plan_puede_iniciar_checkout(checkout):
    cliente, motor, _, _ = checkout
    with Session(motor) as db:
        db.info['institucion_id'] = 1
        db.query(Suscripciones).delete()
        db.commit()
    assert cliente.get('/payments/subscription').json()['can_manage'] is True
    assert cliente.post('/payments/checkout', json={'plan': 'Institucional'}).status_code == 200
    assert cliente.get('/payments/subscription').json()['active'] is False


def test_checkout_token_incorrecto_no_crea_transaccion(checkout, monkeypatch):
    cliente, _, llamadas, _ = checkout
    monkeypatch.setattr(settings, 'PADDLE_CLIENT_TOKEN', 'ctkn_identificador_en_lugar_del_token')
    respuesta = cliente.post('/payments/checkout', json={'plan': 'Institucional'})
    assert respuesta.status_code == 503
    assert respuesta.json()['detail'] == 'El token publico de Paddle Checkout no es valido para el entorno configurado'
    assert llamadas == []


def test_precio_no_mensual_no_crea_checkout(checkout, monkeypatch):
    cliente, _, llamadas, _ = checkout
    def precio_anual(*args, **kwargs):
        return {'status': 'active', 'billing_cycle': {'interval': 'year', 'frequency': 1}}
    monkeypatch.setattr(paddle, '_api', precio_anual)
    assert cliente.post('/payments/checkout', json={'plan': 'Institucional'}).status_code == 422
    assert cliente.get('/payments/subscription').json()['checkout_pending'] is False
    assert llamadas == []


def test_evento_de_cobro_anterior_no_reemplaza_checkout_nuevo(checkout):
    cliente, motor, _, transaccion = checkout
    with Session(motor) as db:
        db.info['institucion_id'] = 1
        suscripcion = db.query(Suscripciones).one()
        suscripcion.estado = 'CANCELADA'
        suscripcion.paddle_subscription_id = 'sub_anterior'
        suscripcion.paddle_transaction_id = 'txn_anterior'
        db.commit()
    transaccion.update(status='completed', subscription_id='sub_anterior')
    assert cliente.post('/payments/checkout', json={'plan': 'Institucional'}).status_code == 200
    evento = {'event_id': 'evt_cobro_viejo', 'event_type': 'transaction.completed',
              'occurred_at': datetime.now(timezone.utc).isoformat(),
              'data': {'id': 'txn_anterior', 'subscription_id': 'sub_anterior', 'custom_data': {'institucion_id': '1'}}}
    assert enviar_evento(cliente, evento).status_code == 409
    assert enviar_evento(cliente, evento_creado()).status_code == 200
