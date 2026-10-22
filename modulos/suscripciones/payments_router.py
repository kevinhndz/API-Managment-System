"""Checkout y webhooks de la suscripcion institucional."""

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd, llaves
from modulos.suscripciones.catalogo import planes_disponibles
from modulos.suscripciones.paddle import cancelar_al_fin, cambiar_plan, enlace_factura, enlaces_portal, historial_transacciones, metodo_pago, procesar_evento, reactivar_programada, verificar_firma
from modulos.suscripciones.service import esta_vigente, obtener_suscripcion
from utils.auth import permiso_admin, permiso_usuario

router = APIRouter(prefix="/payments", tags=["Pagos de suscripcion"])


@router.get("/subscription")
def suscripcion_institucional(usuario: dict = Depends(permiso_usuario), db: Session = Depends(abrir_puerta_bd)):
    suscripcion = obtener_suscripcion(db)
    if suscripcion is None:
        return {"institucion_id": usuario["institucion_id"], "plan_name": None, "status": "SIN_PLAN", "active": False,
                "current_period_start": None, "current_period_end": None, "cancel_at_period_end": False,
                "has_paddle_subscription": False, "checkout_pending": False, "can_manage": False}
    return {"institucion_id": suscripcion.institucion_id, "plan_name": suscripcion.plan, "status": suscripcion.estado,
            "active": esta_vigente(suscripcion),
            "current_period_start": suscripcion.periodo_actual_inicio or suscripcion.inicia_en,
            "current_period_end": suscripcion.periodo_actual_fin or suscripcion.vence_en,
            "cancel_at_period_end": suscripcion.cancelar_al_fin_periodo,
            "has_paddle_subscription": bool(suscripcion.paddle_subscription_id),
            "checkout_pending": bool(suscripcion.paddle_transaction_id and not suscripcion.paddle_subscription_id),
            "can_manage": usuario["rol"].casefold() in {"admin", "administrador"}}


@router.post("/portal")
def portal(administrador: dict = Depends(permiso_admin), db: Session = Depends(abrir_puerta_bd)):
    suscripcion = obtener_suscripcion(db)
    if suscripcion is None:
        raise HTTPException(404, "No existe suscripcion institucional")
    return enlaces_portal(suscripcion)


@router.get("/history")
def historial(administrador: dict = Depends(permiso_admin), db: Session = Depends(abrir_puerta_bd)):
    suscripcion = obtener_suscripcion(db)
    return historial_transacciones(suscripcion) if suscripcion else []


@router.get("/payment-method")
def metodo(administrador: dict = Depends(permiso_admin), db: Session = Depends(abrir_puerta_bd)):
    suscripcion = obtener_suscripcion(db)
    return {"method": metodo_pago(suscripcion) if suscripcion else None}


@router.get("/transactions/{transaccion_id}/invoice")
def factura(transaccion_id: str, administrador: dict = Depends(permiso_admin), db: Session = Depends(abrir_puerta_bd)):
    suscripcion = obtener_suscripcion(db)
    if not suscripcion:
        raise HTTPException(404, "Suscripcion no encontrada")
    return {"url": enlace_factura(suscripcion, transaccion_id)}


@router.post("/cancel")
def cancelar(administrador: dict = Depends(permiso_admin), db: Session = Depends(abrir_puerta_bd)):
    suscripcion = obtener_suscripcion(db)
    if not suscripcion:
        raise HTTPException(404, "Suscripcion no encontrada")
    cancelar_al_fin(suscripcion)
    return {"detail": "Cancelacion solicitada a Paddle; espera la confirmacion del webhook"}


@router.post("/reactivate")
def reactivar(administrador: dict = Depends(permiso_admin), db: Session = Depends(abrir_puerta_bd)):
    suscripcion = obtener_suscripcion(db)
    if not suscripcion:
        raise HTTPException(404, "Suscripcion no encontrada")
    reactivar_programada(suscripcion)
    return {"detail": "Reactivacion solicitada a Paddle; espera la confirmacion del webhook"}


class CambioPlan(BaseModel):
    plan: str


@router.post("/change-plan")
def cambiar(datos: CambioPlan, administrador: dict = Depends(permiso_admin), db: Session = Depends(abrir_puerta_bd)):
    suscripcion = obtener_suscripcion(db)
    if not suscripcion:
        raise HTTPException(404, "Suscripcion no encontrada")
    precio = next((plan["price_id"] for plan in planes_disponibles() if plan["nombre"] == datos.plan), None)
    if not precio:
        raise HTTPException(422, "Plan no disponible")
    cambiar_plan(suscripcion, precio)
    return {"detail": "Cambio solicitado a Paddle; espera la confirmacion del webhook"}


@router.post("/paddle/webhook")
async def webhook(request: Request, paddle_signature: str | None = Header(None, alias="Paddle-Signature")):
    evento = verificar_firma(await request.body(), paddle_signature)
    with llaves() as db:
        procesado = procesar_evento(db, evento)
    return {"procesado": procesado}
