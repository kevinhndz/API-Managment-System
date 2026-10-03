from sqlalchemy.orm import Session
from database.almacen import abrir_puerta_bd
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