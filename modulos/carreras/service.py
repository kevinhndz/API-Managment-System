from sqlalchemy.orm import Session

from core.excepciones import RecursoDuplicadoError, RecursoNoEncontradoError
from modulos.carreras.repository import CarreraRepository as repo
from modulos.carreras.schema import (
    Editar_Parcialmente_Carrera,
    Revisar_Json_Crear_Carrera,
    Revisar_Json_Editar_Carrera,
)
from modulos.carreras.tabla import Carreras


class CarrerasService:
    @staticmethod
    def crear_service(db: Session, json: Revisar_Json_Crear_Carrera):
        check = repo.check_repository(db, json)
        if check is not None:
            raise RecursoDuplicadoError("Ya existe esta carrera")

        nueva_carrera = Carreras(
            codigo=json.codigo,
            nombre=json.nombre,
            duracion_anios=json.duracion_anios,
            activo=json.activo,
        )
        return repo.guardar_carrera_repository(db, nueva_carrera)

    @staticmethod
    def listar_service(db: Session):
        return repo.listar_repository(db)

    @staticmethod
    def buscar_service(db: Session, id: int):
        check = repo.buscar_repository(db, id)
        if check is None:
            raise RecursoNoEncontradoError("No existe esta carrera")
        return check

    @staticmethod
    def editar_service(db: Session, id: int, json: Revisar_Json_Editar_Carrera):
        check = repo.buscar_repository(db, id)
        if check is None:
            raise RecursoNoEncontradoError("No existe esta carrera")

        repo_check = repo.check_repository(db, json)
        if repo_check is not None and repo_check.id != id:
            raise RecursoDuplicadoError("Ya existe esta carrera")

        check.codigo = json.codigo
        check.nombre = json.nombre
        check.duracion_anios = json.duracion_anios
        check.activo = json.activo
        return repo.guardar_carrera_repository(db, check)

    @staticmethod
    def editar_parcialmente_service(
        db: Session, id: int, json: Editar_Parcialmente_Carrera
    ):
        check = repo.buscar_repository(db, id)
        if check is None:
            raise RecursoNoEncontradoError("No existe esta carrera")

        cambios = json.model_dump(exclude_unset=True)
        if cambios:
            for nombre, valor in cambios.items():
                setattr(check, nombre, valor)

            repo_check = repo.check_repository(db, check)
            if repo_check is not None and repo_check.id != id:
                raise RecursoDuplicadoError("Ya existe esta carrera")

        return repo.guardar_carrera_repository(db, check)

    @staticmethod
    def eliminar_service(db: Session, id: int):
        check = repo.buscar_repository(db, id)
        if check is None:
            raise RecursoNoEncontradoError("No existe esta carrera")
        repo.eliminar_carrera_repository(db, check)
