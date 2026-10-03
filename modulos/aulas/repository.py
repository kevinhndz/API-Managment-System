from sqlalchemy.orm import Session
from modulos.aulas.tabla import Aulas



class AulaRepository():
    
    @staticmethod
    def check_repository (db: Session, json):
      return db.query(Aulas).filter(Aulas.codigo == json.codigo).first()
  
    @staticmethod
    def guardar_aula_repository(db: Session, nueva_aula):
        db.add(nueva_aula)
        db.commit()
        db.refresh(nueva_aula)
        return nueva_aula

    @staticmethod
    def listar_repository(db: Session, pagina_actual: int, limite: int):
        query = db.query(Aulas)
        total = query.count()
        data = query.offset((pagina_actual - 1) * limite).limit(limite).all()
        return total, data

    @staticmethod
    def buscar_repository(db: Session, id):
        return db.query(Aulas).filter(Aulas.id == id).first()

    @staticmethod
    def eliminar_aula_repository(db: Session, aula):
        db.delete(aula)
        db.commit()
