from math import ceil
from sqlalchemy.orm import Session
from core.excepciones import RecursoDuplicadoError, RecursoNoEncontradoError
from core.schema import RespuestaPaginada
from modulos.matriculas.repository import MatriculaRepository as repo
from modulos.matriculas.schema import *
from modulos.matriculas.tabla import Matriculas


class MatriculasService:
    @staticmethod
    def _validar_referencias_y_reglas(
        db: Session,
        estudiante_id: int,
        seccion_id: int,
        estado: str,
        excluir_id: int | None = None,
    ) -> None:
        estudiante = repo.buscar_estudiante_bloqueado_repository(db, estudiante_id)
        if estudiante is None:
            raise RecursoNoEncontradoError("No existe este estudiante")

        seccion = repo.buscar_seccion_bloqueada_repository(db, seccion_id)
        if seccion is None:
            raise RecursoNoEncontradoError("No existe esta seccion")

        duplicada = repo.buscar_duplicada_repository(db, estudiante_id, seccion_id, excluir_id)
        if duplicada is not None:
            raise RecursoDuplicadoError("El estudiante ya esta matriculado en esta seccion")

        asignatura = repo.buscar_asignatura_repository(db, seccion.asignatura_id)
        if asignatura is None:
            raise RecursoNoEncontradoError("No existe esta asignatura")

        if asignatura.requisito_id is not None:
            requisito_aprobado = repo.buscar_requisito_aprobado_repository(
                db, estudiante_id, asignatura.requisito_id,
            )
            if requisito_aprobado is None:
                raise RecursoDuplicadoError(
                    "El estudiante no ha aprobado el requisito de esta asignatura"
                )

        if estado == "ACTIVA":
            ocupados = repo.contar_activas_repository(db, seccion_id, excluir_id)
            if ocupados >= seccion.cupo_maximo:
                raise RecursoDuplicadoError("No hay cupos disponibles")

    @staticmethod
    def crear_service(db: Session, json: Revisar_Json_Crear_Matricula):
        MatriculasService._validar_referencias_y_reglas(
            db, json.estudiante_id, json.seccion_id, json.estado
        )
        matricula = Matriculas(
            estudiante_id=json.estudiante_id,
            seccion_id=json.seccion_id,
            fecha_matricula=json.fecha_matricula,
            estado=json.estado,
        )
        return repo.guardar_matricula_repository(db, matricula)

    @staticmethod
    def listar_service(db: Session, pagina_actual: int, limite: int, docente_id: int | None = None):
        total, data = repo.listar_repository(db, pagina_actual, limite, docente_id)
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
        MatriculasService._validar_referencias_y_reglas(
            db, json.estudiante_id, json.seccion_id, json.estado, excluir_id=id
        )
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
        cambios = json.model_dump(exclude_unset=True)
        estudiante_id = cambios.get("estudiante_id", check.estudiante_id)
        seccion_id = cambios.get("seccion_id", check.seccion_id)
        estado = cambios.get("estado", check.estado)
        MatriculasService._validar_referencias_y_reglas(
            db, estudiante_id, seccion_id, estado, excluir_id=id
        )
        if "estudiante_id" in cambios:
            check.estudiante_id = estudiante_id
        if "seccion_id" in cambios:
            check.seccion_id = seccion_id
        if json.fecha_matricula is not None:
            check.fecha_matricula = json.fecha_matricula
        if "estado" in cambios:
            check.estado = estado
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
