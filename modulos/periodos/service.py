from math import ceil

from sqlalchemy.orm import Session

from core.excepciones import RecursoDuplicadoError, RecursoNoEncontradoError
from core.schema import RespuestaPaginada
from modulos.periodos.repository import PeriodoRepository as repo
from modulos.periodos.schema import (
    Editar_Parcialmente_Periodo, PeriodoResponse,
    Revisar_Json_Crear_Periodo, Revisar_Json_Editar_Periodo,
)
from modulos.periodos.tabla import Periodos


class PeriodosService:
    @staticmethod
    def crear_service(db: Session, json: Revisar_Json_Crear_Periodo):
        check = repo.check_repository(db, json)
        if check is not None:
            raise RecursoDuplicadoError("Ya existe este periodo")
        if json.activo and db.query(Periodos).filter(Periodos.activo == True).first() is not None:
            raise RecursoDuplicadoError("Ya existe un periodo activo")
        nuevo_periodo = Periodos(
            anio=json.anio, numero=json.numero, fecha_inicio=json.fecha_inicio,
            fecha_fin=json.fecha_fin, activo=json.activo,
        )
        return repo.guardar_periodo_repository(db, nuevo_periodo)

    @staticmethod
    def listar_service(db: Session, pagina_actual: int, limite: int):
        total, data = repo.listar_repository(db, pagina_actual, limite)
        return RespuestaPaginada[PeriodoResponse](
            total=total, pagina_actual=pagina_actual, limite=limite,
            total_paginas=ceil(total / limite) if total else 0, data=data,
        )

    @staticmethod
    def buscar_service(db: Session, id: int):
        check = repo.buscar_repository(db, id)
        if check is None:
            raise RecursoNoEncontradoError("No existe este periodo")
        return check

    @staticmethod
    def editar_service(db: Session, id: int, json: Revisar_Json_Editar_Periodo):
        check = PeriodosService.buscar_service(db, id)
        repo_check = repo.check_repository(db, json)
        if repo_check is not None and repo_check.id != id:
            raise RecursoDuplicadoError("Ya existe este periodo")
        if json.activo and db.query(Periodos).filter(Periodos.activo == True, Periodos.id != id).first() is not None:
            raise RecursoDuplicadoError("Ya existe un periodo activo")
        check.anio = json.anio
        check.numero = json.numero
        check.fecha_inicio = json.fecha_inicio
        check.fecha_fin = json.fecha_fin
        check.activo = json.activo
        return repo.guardar_periodo_repository(db, check)

    @staticmethod
    def editar_parcialmente_service(db: Session, id: int, json: Editar_Parcialmente_Periodo):
        check = PeriodosService.buscar_service(db, id)
        if json.activo is True and db.query(Periodos).filter(Periodos.activo == True, Periodos.id != id).first() is not None:
            raise RecursoDuplicadoError("Ya existe un periodo activo")
        if json.anio is not None:
            check.anio = json.anio
        if json.numero is not None:
            check.numero = json.numero
        if json.fecha_inicio is not None:
            check.fecha_inicio = json.fecha_inicio
        if json.fecha_fin is not None:
            check.fecha_fin = json.fecha_fin
        if json.activo is not None:
            check.activo = json.activo
        return repo.guardar_periodo_repository(db, check)

    @staticmethod
    def eliminar_service(db: Session, id: int):
        check = PeriodosService.buscar_service(db, id)
        repo.eliminar_periodo_repository(db, check)
