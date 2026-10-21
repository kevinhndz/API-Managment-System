"""Registra un pago confirmado y habilita reportes de una universidad."""

import argparse
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal, InvalidOperation

from sqlalchemy import select

from database.almacen import Instituciones, llaves
from modulos.auditoria.tabla import EventoAuditoria
from modulos.suscripciones.tabla import PagosSuscripcion, Suscripciones


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Registra un pago confirmado y activa la suscripcion institucional."
    )
    parser.add_argument("slug", help="Identificador de la universidad")
    parser.add_argument("--referencia", required=True, help="Referencia del pago confirmado")
    parser.add_argument("--monto", required=True, help="Monto recibido, por ejemplo 3500.00")
    parser.add_argument("--moneda", required=True, choices=("HNL", "USD"))
    parser.add_argument("--hasta", required=True, help="Ultimo dia pagado, formato AAAA-MM-DD")
    parser.add_argument("--plan", default="PREMIUM", help="Nombre del plan contratado")
    args = parser.parse_args()

    try:
        monto = Decimal(args.monto)
        ultimo_dia = date.fromisoformat(args.hasta)
    except (InvalidOperation, ValueError):
        parser.error("Monto o fecha de vencimiento invalidos")
    ahora = datetime.now(timezone.utc)
    vence_en = datetime.combine(ultimo_dia + timedelta(days=1), time.min, timezone.utc)
    if monto <= 0 or not monto.is_finite() or monto.as_tuple().exponent < -2:
        parser.error("El monto debe ser positivo y tener maximo dos decimales")
    if vence_en <= ahora:
        parser.error("La fecha de vencimiento debe ser futura")
    referencia = args.referencia.strip()
    plan = args.plan.strip().upper()
    if not referencia or len(referencia) > 100 or not plan or len(plan) > 40:
        parser.error("Referencia o plan invalidos")

    with llaves() as db:
        institucion = db.scalar(
            select(Instituciones).where(Instituciones.slug == args.slug.strip().casefold())
        )
        if institucion is None:
            parser.error("No existe una universidad con ese identificador")
        db.info["institucion_id"] = institucion.id
        suscripcion = db.scalar(
            select(Suscripciones)
            .where(Suscripciones.institucion_id == institucion.id)
            .with_for_update()
        )
        if suscripcion is None:
            parser.error("La universidad no tiene suscripcion creada")
        if suscripcion.estado == "ACTIVA" and vence_en <= suscripcion.vence_en:
            parser.error("El nuevo pago debe extender el vencimiento actual")
        duplicado = db.scalar(
            select(PagosSuscripcion.id).where(
                PagosSuscripcion.institucion_id == institucion.id,
                PagosSuscripcion.referencia == referencia,
            )
        )
        if duplicado is not None:
            parser.error("La referencia ya fue registrada para esta universidad")

        db.add(PagosSuscripcion(
            institucion_id=institucion.id,
            referencia=referencia,
            monto=monto,
            moneda=args.moneda,
            pagado_en=ahora,
            cubre_hasta=vence_en,
        ))
        suscripcion.plan = plan
        suscripcion.estado = "ACTIVA"
        suscripcion.inicia_en = ahora
        suscripcion.vence_en = vence_en
        db.add(EventoAuditoria(
            institucion_id=institucion.id,
            usuario="operador_saas",
            accion="ACTIVAR",
            modulo="suscripciones",
            registro_id=suscripcion.id,
            descripcion=f"Pago confirmado con referencia {referencia}",
        ))
        db.commit()
        print(f"Suscripcion activada para {institucion.slug} hasta {ultimo_dia.isoformat()}")


if __name__ == "__main__":
    main()
