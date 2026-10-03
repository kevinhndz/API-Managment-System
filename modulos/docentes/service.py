from math import ceil

from sqlalchemy.orm import Session

from core.excepciones import RecursoDuplicadoError, RecursoNoEncontradoError
from core.schema import RespuestaPaginada
from modulos.docentes.repository import DocenteRepository as repo
from modulos.docentes.schema import (
    DocenteResponse,
    Editar_Parcialmente_Docente,
    Revisar_Json_Crear_Docente,
    Revisar_Json_Editar_Docente,
)
from modulos.docentes.tabla import Docentes


class DocentesService:
    @staticmethod
    def crear_service(db: Session, json: Revisar_Json_Crear_Docente):
        check = repo.check_repository(db, json)
        if check is not None:
            raise RecursoDuplicadoError("Ya existe este docente")

        nueva_docente = Docentes(
            numero_empleado=json.numero_empleado,
            nombres=json.nombres,
            apellidos=json.apellidos,
            correo=json.correo,
            especialidad=json.especialidad,
            estado=json.estado,
        )
        return repo.guardar_docente_repository(db, nueva_docente)

    @staticmethod
    def listar_service(db: Session, pagina_actual: int, limite: int):
        total, data = repo.listar_repository(db, pagina_actual, limite)
        return RespuestaPaginada[DocenteResponse](
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
            raise RecursoNoEncontradoError("No existe este docente")
        return check

    @staticmethod
    def editar_service(db: Session, id: int, json: Revisar_Json_Editar_Docente):
        check = repo.buscar_repository(db, id)
        if check is None:
            raise RecursoNoEncontradoError("No existe este docente")

        repo_check = repo.check_repository(db, json)
        if repo_check is not None and repo_check.id != id:
            raise RecursoDuplicadoError("Ya existe este docente")

        check.numero_empleado = json.numero_empleado
        check.nombres = json.nombres
        check.apellidos = json.apellidos
        check.correo = json.correo
        check.especialidad = json.especialidad
        check.estado = json.estado
        return repo.guardar_docente_repository(db, check)

    @staticmethod
    def editar_parcialmente_service(
        db: Session, id: int, json: Editar_Parcialmente_Docente
    ):
        check = repo.buscar_repository(db, id)
        if check is None:
            raise RecursoNoEncontradoError("No existe este docente")

        cambios = json.model_dump(exclude_unset=True)
        if cambios:
            for nombre, valor in cambios.items():
                setattr(check, nombre, valor)

            repo_check = repo.check_repository(db, check)
            if repo_check is not None and repo_check.id != id:
                raise RecursoDuplicadoError("Ya existe este docente")

        return repo.guardar_docente_repository(db, check)

    @staticmethod
    def eliminar_service(db: Session, id: int):
        check = repo.buscar_repository(db, id)
        if check is None:
            raise RecursoNoEncontradoError("No existe este docente")
        repo.eliminar_docente_repository(db, check)
