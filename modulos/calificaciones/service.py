from math import ceil
from sqlalchemy.orm import Session
from core.excepciones import RecursoDuplicadoError, RecursoNoEncontradoError
from core.schema import RespuestaPaginada
from modulos.calificaciones.repository import CalificacionRepository as repo
from modulos.calificaciones.schema import *
from modulos.calificaciones.tabla import Calificaciones
from modulos.matriculas.tabla import Matriculas


class CalificacionesService:
    @staticmethod
    def crear_service(db: Session, json: Revisar_Json_Crear_Calificacion):
        if repo.check_repository(db, json) is not None:
            raise RecursoDuplicadoError("Ya existe la calificacion")
        matricula = (
            db.query(Matriculas).filter(Matriculas.id == json.matricula_id).first()
        )
        if matricula is None:
            raise RecursoNoEncontradoError("No existe esta matricula")
        nota = (json.primer_parcial + json.segundo_parcial + json.tercer_parcial) / 3
        calificacion = Calificaciones(
            matricula_id=json.matricula_id,
            primer_parcial=json.primer_parcial,
            segundo_parcial=json.segundo_parcial,
            tercer_parcial=json.tercer_parcial,
            nota_final=nota,
            observacion=json.observacion,
        )
        matricula.estado = "APROBADA" if nota >= 60 else "REPROBADA"
        return repo.guardar_calificacion_repository(db, calificacion)

    @staticmethod
    def listar_service(db: Session, pagina_actual: int, limite: int):
        total, data = repo.listar_repository(db, pagina_actual, limite)
        return RespuestaPaginada[CalificacionResponse](
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
            raise RecursoNoEncontradoError("No existe esta calificacion")
        return check

    @staticmethod
    def editar_service(db: Session, id: int, json: Revisar_Json_Editar_Calificacion):
        check = CalificacionesService.buscar_service(db, id)
        check.primer_parcial = json.primer_parcial
        check.segundo_parcial = json.segundo_parcial
        check.tercer_parcial = json.tercer_parcial
        check.observacion = json.observacion
        check.nota_final = (
            json.primer_parcial + json.segundo_parcial + json.tercer_parcial
        ) / 3
        return repo.guardar_calificacion_repository(db, check)

    @staticmethod
    def editar_parcialmente_service(
        db: Session, id: int, json: Editar_Parcialmente_Calificacion
    ):
        check = CalificacionesService.buscar_service(db, id)
        if json.primer_parcial is not None:
            check.primer_parcial = json.primer_parcial
        if json.segundo_parcial is not None:
            check.segundo_parcial = json.segundo_parcial
        if json.tercer_parcial is not None:
            check.tercer_parcial = json.tercer_parcial
        if json.observacion is not None:
            check.observacion = json.observacion
        check.nota_final = (
            check.primer_parcial + check.segundo_parcial + check.tercer_parcial
        ) / 3
        return repo.guardar_calificacion_repository(db, check)

    @staticmethod
    def eliminar_service(db: Session, id: int):
        check = CalificacionesService.buscar_service(db, id)
        repo.eliminar_calificacion_repository(db, check)
