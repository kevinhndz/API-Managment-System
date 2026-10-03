from math import ceil
from sqlalchemy.orm import Session
from core.excepciones import RecursoDuplicadoError, RecursoNoEncontradoError
from core.schema import RespuestaPaginada
from modulos.matriculas.repository import MatriculaRepository as repo
from modulos.matriculas.schema import *
from modulos.matriculas.tabla import Matriculas
from modulos.secciones.tabla import Secciones


class MatriculasService:
    @staticmethod
    def crear_service(db: Session, json: Revisar_Json_Crear_Matricula):
        if repo.check_repository(db, json) is not None:
            raise RecursoDuplicadoError(
                "El estudiante ya esta matriculado en esta seccion"
            )
        seccion = db.query(Secciones).filter(Secciones.id == json.seccion_id).first()
        if seccion is None:
            raise RecursoNoEncontradoError("No existe esta seccion")
        ocupados = (
            db.query(Matriculas)
            .filter(
                Matriculas.seccion_id == json.seccion_id, Matriculas.estado == "ACTIVA"
            )
            .count()
        )
        if ocupados >= seccion.cupo_maximo:
            raise RecursoDuplicadoError("No hay cupos disponibles")
        matricula = Matriculas(
            estudiante_id=json.estudiante_id,
            seccion_id=json.seccion_id,
            fecha_matricula=json.fecha_matricula,
            estado=json.estado,
        )
        return repo.guardar_matricula_repository(db, matricula)

    @staticmethod
    def listar_service(db: Session, pagina_actual: int, limite: int):
        total, data = repo.listar_repository(db, pagina_actual, limite)
        return RespuestaPaginada[MatriculaResponse](
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
            raise RecursoNoEncontradoError("No existe esta matricula")
        return check

    @staticmethod
    def editar_service(db: Session, id: int, json: Revisar_Json_Editar_Matricula):
        check = MatriculasService.buscar_service(db, id)
        check.estudiante_id = json.estudiante_id
        check.seccion_id = json.seccion_id
        check.fecha_matricula = json.fecha_matricula
        check.estado = json.estado
        return repo.guardar_matricula_repository(db, check)

    @staticmethod
    def editar_parcialmente_service(
        db: Session, id: int, json: Editar_Parcialmente_Matricula
    ):
        check = MatriculasService.buscar_service(db, id)
        if json.estudiante_id is not None:
            check.estudiante_id = json.estudiante_id
        if json.seccion_id is not None:
            check.seccion_id = json.seccion_id
        if json.fecha_matricula is not None:
            check.fecha_matricula = json.fecha_matricula
        if json.estado is not None:
            check.estado = json.estado
        return repo.guardar_matricula_repository(db, check)

    @staticmethod
    def cancelar_service(db: Session, id: int):
        check = MatriculasService.buscar_service(db, id)
        check.estado = "CANCELADA"
        return repo.guardar_matricula_repository(db, check)

    @staticmethod
    def eliminar_service(db: Session, id: int):
        check = MatriculasService.buscar_service(db, id)
        repo.eliminar_matricula_repository(db, check)
