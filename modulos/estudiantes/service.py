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
        estudiante = Estudiantes(
            cuenta=json.cuenta,
            nombre=json.nombre,
            correo=json.correo,
            telefono=json.telefono,
            fechaNacimiento=json.fechaNacimiento,
            carrera_id=json.carrera_id,
            estado=json.estado,
        )
        return repo.guardar_estudiante_repository(db, estudiante)

    @staticmethod
    def listar_service(db: Session, pagina_actual: int, limite: int, docente_id: int | None = None):
        total, data = repo.listar_repository(db, pagina_actual, limite, docente_id)
        return RespuestaPaginada[EstudianteResponse](
            total=total,
            pagina_actual=pagina_actual,
            limite=limite,
            total_paginas=ceil(total / limite) if total else 0,
            data=data,
        )

    @staticmethod
    def buscar_service(db: Session, id: int, docente_id: int | None = None):
        check = repo.buscar_repository(db, id, docente_id)
        if check is None:
            raise RecursoNoEncontradoError("No existe este estudiante")
        return check

    @staticmethod
    def editar_service(db: Session, id: int, json: Revisar_Json_Editar_Estudiante, docente_id: int | None = None):
        check = repo.buscar_repository(db, id, docente_id)
        if check is None:
            raise RecursoNoEncontradoError("No existe este estudiante")

        repo_check = repo.check_repository(db, json)
        if repo_check is not None and repo_check.id != id:
            raise RecursoDuplicadoError("Ya existe este estudiante")

        check.cuenta = json.cuenta
        check.nombre = json.nombre
        check.correo = json.correo
        check.telefono = json.telefono
        check.fechaNacimiento = json.fechaNacimiento
        check.carrera_id = json.carrera_id
        check.estado = json.estado
        return repo.guardar_estudiante_repository(db, check)

    @staticmethod
    def editar_parcialmente_service(
        db: Session, id: int, json: Editar_Parcialmente_Estudiante, docente_id: int | None = None
    ):
        check = repo.buscar_repository(db, id, docente_id)
        if check is None:
            raise RecursoNoEncontradoError("No existe este estudiante")

        cambios = json.model_dump(exclude_unset=True)
        if cambios:
            for nombre, valor in cambios.items():
                setattr(check, nombre, valor)

            repo_check = repo.check_repository(db, check)
            if repo_check is not None and repo_check.id != id:
                raise RecursoDuplicadoError("Ya existe este estudiante")
        return repo.guardar_estudiante_repository(db, check)

    @staticmethod
    def eliminar_service(db: Session, id: int):
        check = EstudiantesService.buscar_service(db, id)
        repo.eliminar_estudiante_repository(db, check)
