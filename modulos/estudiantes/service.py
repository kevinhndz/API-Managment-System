from math import ceil

from sqlalchemy.orm import Session

from core.excepciones import RecursoDuplicadoError, RecursoNoEncontradoError
from core.schema import RespuestaPaginada
from modulos.estudiantes.repository import EstudianteRepository as repo
from modulos.estudiantes.schema import (
    Editar_Parcialmente_Estudiante,
    EstudianteResponse,
    Revisar_Json_Crear_Estudiante,
    Revisar_Json_Editar_Estudiante,
)
from modulos.estudiantes.tabla import Estudiantes


class EstudiantesService:
    @staticmethod
    def crear_service(db: Session, json: Revisar_Json_Crear_Estudiante):
        check = repo.check_repository(db, json)
        if check is not None:
            raise RecursoDuplicadoError("Ya existe este estudiante")
        estudiante = Estudiantes(**json.model_dump())
        return repo.guardar_estudiante_repository(db, estudiante)

    @staticmethod
    def listar_service(db: Session, pagina_actual: int, limite: int):
        total, data = repo.listar_repository(db, pagina_actual, limite)
        return RespuestaPaginada[EstudianteResponse](
            total=total,
            pagina_actual=pagina_actual,
            limite=limite,
            total_paginas=ceil(total / limite) if total else 0,
            data=data,
        )

    @staticmethod
    def buscar_service(db: Session, id: int):
        check = repo.buscar_repository(db, id)
        if check is None:
            raise RecursoNoEncontradoError("No existe este estudiante")
        return check

    @staticmethod
    def editar_service(db: Session, id: int, json: Revisar_Json_Editar_Estudiante):
        check = EstudiantesService.buscar_service(db, id)
        repo_check = repo.check_repository(db, json)
        if repo_check is not None and repo_check.id != id:
            raise RecursoDuplicadoError("Ya existe este estudiante")
        for nombre, valor in json.model_dump().items():
            setattr(check, nombre, valor)
        return repo.guardar_estudiante_repository(db, check)

    @staticmethod
    def editar_parcialmente_service(
        db: Session, id: int, json: Editar_Parcialmente_Estudiante
    ):
        check = EstudiantesService.buscar_service(db, id)
        cambios = json.model_dump(exclude_unset=True)
        for nombre, valor in cambios.items():
            setattr(check, nombre, valor)
        if cambios and repo.check_repository(db, check) not in (None, check):
            raise RecursoDuplicadoError("Ya existe este estudiante")
        return repo.guardar_estudiante_repository(db, check)

    @staticmethod
    def eliminar_service(db: Session, id: int):
        check = EstudiantesService.buscar_service(db, id)
        repo.eliminar_estudiante_repository(db, check)
