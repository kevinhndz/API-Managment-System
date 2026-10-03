from math import ceil

from sqlalchemy.orm import Session

from core.excepciones import RecursoDuplicadoError, RecursoNoEncontradoError
from core.schema import RespuestaPaginada
from modulos.asignaturas.repository import AsignaturaRepository as repo
from modulos.asignaturas.schema import (
    AsignaturaResponse, Editar_Parcialmente_Asignatura,
    Revisar_Json_Crear_Asignatura, Revisar_Json_Editar_Asignatura,
)
from modulos.asignaturas.tabla import Asignaturas


class AsignaturasService:
    @staticmethod
    def crear_service(db: Session, json: Revisar_Json_Crear_Asignatura):
        check = repo.check_repository(db, json)
        if check is not None:
            raise RecursoDuplicadoError("Ya existe esta asignatura")
        nueva_asignatura = Asignaturas(
            codigo=json.codigo, nombre=json.nombre,
            unidades_valorativas=json.unidades_valorativas,
            carrera_id=json.carrera_id, requisito_id=json.requisito_id,
            activo=json.activo,
        )
        return repo.guardar_asignatura_repository(db, nueva_asignatura)

    @staticmethod
    def listar_service(db: Session, pagina_actual: int, limite: int):
        total, data = repo.listar_repository(db, pagina_actual, limite)
        return RespuestaPaginada[AsignaturaResponse](
            total=total, pagina_actual=pagina_actual, limite=limite,
            total_paginas=ceil(total / limite) if total else 0, data=data,
        )

    @staticmethod
    def buscar_service(db: Session, id: int):
        check = repo.buscar_repository(db, id)
        if check is None:
            raise RecursoNoEncontradoError("No existe esta asignatura")
        return check

    @staticmethod
    def editar_service(db: Session, id: int, json: Revisar_Json_Editar_Asignatura):
        check = AsignaturasService.buscar_service(db, id)
        repo_check = repo.check_repository(db, json)
        if repo_check is not None and repo_check.id != id:
            raise RecursoDuplicadoError("Ya existe esta asignatura")
        check.codigo = json.codigo
        check.nombre = json.nombre
        check.unidades_valorativas = json.unidades_valorativas
        check.carrera_id = json.carrera_id
        check.requisito_id = json.requisito_id
        check.activo = json.activo
        return repo.guardar_asignatura_repository(db, check)

    @staticmethod
    def editar_parcialmente_service(db: Session, id: int, json: Editar_Parcialmente_Asignatura):
        check = AsignaturasService.buscar_service(db, id)
        if json.codigo is not None:
            check.codigo = json.codigo
        if json.nombre is not None:
            check.nombre = json.nombre
        if json.unidades_valorativas is not None:
            check.unidades_valorativas = json.unidades_valorativas
        if json.carrera_id is not None:
            check.carrera_id = json.carrera_id
        if json.requisito_id is not None:
            check.requisito_id = json.requisito_id
        if json.activo is not None:
            check.activo = json.activo
        if json.codigo is not None:
            repo_check = repo.check_repository(db, check)
            if repo_check is not None and repo_check.id != id:
                raise RecursoDuplicadoError("Ya existe esta asignatura")
        return repo.guardar_asignatura_repository(db, check)

    @staticmethod
    def eliminar_service(db: Session, id: int):
        check = AsignaturasService.buscar_service(db, id)
        repo.eliminar_asignatura_repository(db, check)
