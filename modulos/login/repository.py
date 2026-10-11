from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from modulos.login.tabla import IntentosInicioSesion, Usuarios


class UsuarioRepository:
    @staticmethod
    def check_repository(db: Session, json):
        return db.query(Usuarios).filter(Usuarios.usuario == json.usuario).first()

    @staticmethod
    def buscar_usuario_repository(db: Session, usuario):
        return db.query(Usuarios).filter(Usuarios.usuario == usuario).first()

    @staticmethod
    def guardar_usuario_repository(db: Session, usuario):
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        return usuario

    @staticmethod
    def buscar_por_id_repository(db: Session, usuario_id: int):
        return db.query(Usuarios).filter(Usuarios.id == usuario_id).first()

    @staticmethod
    def buscar_correo_de_otra_cuenta_repository(db: Session, correo: str, usuario_id: int):
        return db.query(Usuarios.id).filter(
            func.lower(Usuarios.correo) == correo,
            Usuarios.id != usuario_id,
        ).first()

    @staticmethod
    @staticmethod
    def guardar_cambios_perfil_repository(db: Session, usuario: Usuarios):
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        return usuario


class IntentosInicioSesionRepository:
    @staticmethod
    def buscar_bloqueo_repository(db: Session, claves: list[str], ahora):
        registros = db.scalars(
            select(IntentosInicioSesion).where(IntentosInicioSesion.clave_hash.in_(claves))
        ).all()
        segundos = []
        for registro in registros:
            bloqueado_hasta = registro.bloqueado_hasta
            if bloqueado_hasta is not None:
                if bloqueado_hasta.tzinfo is None:
                    bloqueado_hasta = bloqueado_hasta.replace(tzinfo=ahora.tzinfo)
                if bloqueado_hasta > ahora:
                    segundos.append((bloqueado_hasta - ahora).total_seconds())
        return max((int(segundo) + 1 for segundo in segundos), default=0)

    @staticmethod
    def registrar_fallo_repository(
        db: Session,
        claves_y_limites,
        ahora,
        ventana_segundos,
        base_bloqueo,
        max_bloqueo,
        reintentar_colision: bool = True,
    ):
        db.query(IntentosInicioSesion).filter(
            IntentosInicioSesion.actualizado_en < ahora - timedelta(days=1)
        ).delete(synchronize_session=False)
        claves = sorted(clave for clave, _ in claves_y_limites)
        limites = dict(claves_y_limites)
        registros = {
            registro.clave_hash: registro
            for registro in db.scalars(
                select(IntentosInicioSesion)
                .where(IntentosInicioSesion.clave_hash.in_(claves))
                .order_by(IntentosInicioSesion.clave_hash)
                .with_for_update()
            ).all()
        }

        for clave in claves:
            registro = registros.get(clave)
            if registro is None:
                registro = IntentosInicioSesion(
                    clave_hash=clave,
                    intentos=0,
                    nivel_bloqueo=0,
                    inicio_ventana=ahora,
                    actualizado_en=ahora,
                )
                db.add(registro)
                registros[clave] = registro

            inicio_ventana = registro.inicio_ventana
            if inicio_ventana.tzinfo is None:
                inicio_ventana = inicio_ventana.replace(tzinfo=ahora.tzinfo)
            if (ahora - inicio_ventana).total_seconds() >= ventana_segundos:
                registro.intentos = 0
                registro.nivel_bloqueo = 0
                registro.inicio_ventana = ahora
                registro.bloqueado_hasta = None

            registro.intentos += 1
            registro.actualizado_en = ahora
            if registro.intentos >= limites[clave]:
                registro.nivel_bloqueo += 1
                duracion = min(base_bloqueo * (2 ** (registro.nivel_bloqueo - 1)), max_bloqueo)
                registro.bloqueado_hasta = ahora + timedelta(seconds=duracion)
                registro.intentos = 0

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            if not reintentar_colision:
                raise
            cantidad = db.scalar(
                select(func.count())
                .select_from(IntentosInicioSesion)
                .where(IntentosInicioSesion.clave_hash.in_(claves))
            )
            if cantidad != len(claves):
                raise
            return IntentosInicioSesionRepository.registrar_fallo_repository(
                db,
                claves_y_limites,
                ahora,
                ventana_segundos,
                base_bloqueo,
                max_bloqueo,
                reintentar_colision=False,
            )
        return IntentosInicioSesionRepository.buscar_bloqueo_repository(db, claves, ahora)

    @staticmethod
    def limpiar_intentos_repository(db: Session, claves: list[str]):
        db.query(IntentosInicioSesion).filter(
            IntentosInicioSesion.clave_hash.in_(claves)
        ).delete(synchronize_session=False)
        db.commit()
