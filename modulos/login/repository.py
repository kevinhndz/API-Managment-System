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
