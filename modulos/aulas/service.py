from sqlalchemy.orm import Session
from modulos.aulas.schema import Revisar_Json_Crear_Aula
from modulos.aulas.repository import AulaRepository as repo
from core.excepciones import RecursoDuplicadoError
from modulos.aulas.tabla import Aulas


class AulasService():
    
    @staticmethod
    def crear_service(db: Session, json:Revisar_Json_Crear_Aula ):
        
        check = repo.check_repository(db, json)
        
        if check is not None:
            raise RecursoDuplicadoError("Ya existe este producto")
        
        nueva_aula = Aulas(
            codigo = json.codigo,
            edificio = json.edificio,
            capacidad = json.capacidad,
            activo = json.activo
        )
        
        return repo.guardar_aula_repository(db, nueva_aula)