from sqlalchemy import func
from sqlalchemy.orm import Session
from modulos.login.tabla import Usuarios


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
