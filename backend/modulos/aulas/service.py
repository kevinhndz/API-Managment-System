from math import ceil

from sqlalchemy.orm import Session

from core.excepciones import RecursoDuplicadoError, RecursoNoEncontradoError
from core.schema import RespuestaPaginada
from modulos.aulas.repository import AulaRepository as repo
from modulos.aulas.schema import (
    AulaResponse,
    Editar_Parcialmente_Aula,
    Revisar_Json_Crear_Aula,
    Revisar_Json_Editar_Aula,
)
from modulos.aulas.tabla import Aulas


class AulasService:

    @staticmethod
    def crear_service(db: Session, json: Revisar_Json_Crear_Aula):

        check = repo.check_repository(db, json)

        if check is not None:
            raise RecursoDuplicadoError("Ya existe esta aula")

        nueva_aula = Aulas(
            codigo=json.codigo,
            edificio=json.edificio,
            capacidad=json.capacidad,
            activo=json.activo,
        )

        return repo.guardar_aula_repository(db, nueva_aula)

    @staticmethod
    def listar_service(db: Session, pagina_actual: int, limite: int):
        total, data = repo.listar_repository(db, pagina_actual, limite)
        return RespuestaPaginada[AulaResponse](
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
            raise RecursoNoEncontradoError("No existe esta aula")
        return check

    @staticmethod
    def editar_service(db: Session, id: int, json: Revisar_Json_Editar_Aula):
        check = repo.buscar_repository(db, id)
        if check is None:
            raise RecursoNoEncontradoError("No existe esta aula")

        repo_check = repo.check_repository(db, json)
        if repo_check is not None and repo_check.id != id:
            raise RecursoDuplicadoError("Ya existe esta aula")

        check.codigo = json.codigo
        check.edificio = json.edificio
        check.capacidad = json.capacidad
        check.activo = json.activo
        return repo.guardar_aula_repository(db, check)

    @staticmethod
    def editar_parcialmente_service(
        db: Session, id: int, json: Editar_Parcialmente_Aula
    ):
        check = repo.buscar_repository(db, id)
        if check is None:
            raise RecursoNoEncontradoError("No existe esta aula")

        cambios = json.model_dump(exclude_unset=True)
        if cambios:
            for nombre, valor in cambios.items():
                setattr(check, nombre, valor)

            repo_check = repo.check_repository(db, check)
            if repo_check is not None and repo_check.id != id:
                raise RecursoDuplicadoError("Ya existe esta aula")

        return repo.guardar_aula_repository(db, check)

    @staticmethod
    def eliminar_service(db: Session, id: int):
        check = repo.buscar_repository(db, id)
        if check is None:
            raise RecursoNoEncontradoError("No existe esta aula")
        repo.eliminar_aula_repository(db, check)
