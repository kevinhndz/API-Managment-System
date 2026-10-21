"""Provision one SaaS institution and its first administrator."""

import argparse
from datetime import datetime, timedelta, timezone
from getpass import getpass

from sqlalchemy import select

from database.almacen import Instituciones, llaves
from modulos.login.tabla import Usuarios
from modulos.suscripciones.tabla import Suscripciones
from utils.hash import encriptar_contrasena


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Crea una institución y su primer administrador."
    )
    parser.add_argument("slug", help="Identificador URL, por ejemplo universidad-x")
    parser.add_argument("nombre", help="Nombre oficial de la institución")
    parser.add_argument("--usuario", required=True, help="Usuario administrador")
    parser.add_argument("--correo", required=True, help="Correo del administrador")
    args = parser.parse_args()

    password = getpass("Contraseña inicial (mínimo 12 caracteres): ")
    confirmation = getpass("Confirma la contraseña: ")
    if len(password) < 12 or password != confirmation:
        parser.error("La contraseña debe tener al menos 12 caracteres y coincidir.")

    db = llaves()
    try:
        existente = db.scalar(
            select(Instituciones).where(Instituciones.slug == args.slug.casefold())
        )
        if existente:
            parser.error("Ya existe una institución con ese identificador.")

        institucion = Instituciones(
            slug=args.slug.casefold(), nombre=args.nombre.strip(), activa=True
        )
        db.add(institucion)
        db.flush()
        db.info["institucion_id"] = institucion.id
        inicio = datetime.now(timezone.utc)
        db.add(
            Suscripciones(
                institucion_id=institucion.id,
                plan="PILOTO",
                estado="PRUEBA",
                inicia_en=inicio,
                vence_en=inicio + timedelta(days=30),
            )
        )

        administrador_existente = db.scalar(
            select(Usuarios.id).where(Usuarios.usuario == args.usuario.strip())
        )
        if administrador_existente:
            raise ValueError("Ese usuario ya existe dentro de la institución.")

        db.add(
            Usuarios(
                institucion_id=institucion.id,
                usuario=args.usuario.strip(),
                nombre=args.usuario.strip(),
                correo=args.correo.strip().casefold(),
                contrasena=encriptar_contrasena(password),
                rol="Administrador",
                activo=True,
            )
        )
        db.commit()
        print(f"Institución creada: {institucion.slug} (id={institucion.id})")
        print(f"Administrador creado: {args.usuario.strip()}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
