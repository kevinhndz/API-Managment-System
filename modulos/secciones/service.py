from math import ceil
from sqlalchemy import or_
from sqlalchemy.orm import Session
from core.excepciones import RecursoDuplicadoError, RecursoNoEncontradoError
from core.schema import RespuestaPaginada
from modulos.aulas.tabla import Aulas
from modulos.asignaturas.tabla import Asignaturas
from modulos.docentes.tabla import Docentes
from modulos.matriculas.tabla import Matriculas
from modulos.periodos.tabla import Periodos
from modulos.secciones.repository import SeccionRepository as repo
from modulos.secciones.reglas import convertir_hora, normalizar_dias, normalizar_hora
from modulos.secciones.schema import *
from modulos.secciones.tabla import Secciones


class SeccionesService:
    @staticmethod
    def _validar_registro(db: Session, valores: dict, excluir_id: int | None = None) -> None:
        codigo_existente = db.query(Secciones).filter(
            Secciones.codigo == valores["codigo"],
            Secciones.id != excluir_id if excluir_id is not None else True,
        ).first()
        if codigo_existente is not None:
            raise RecursoDuplicadoError("Ya existe esta seccion")

        referencias = (
            (Asignaturas, valores["asignatura_id"], "No existe esta asignatura"),
            (Docentes, valores["docente_id"], "No existe este docente"),
            (Periodos, valores["periodo_id"], "No existe este periodo"),
            (Aulas, valores["aula_id"], "No existe esta aula"),
        )
        for modelo, referencia_id, mensaje in referencias:
            referencia = (
                db.query(modelo)
                .filter(modelo.id == referencia_id)
                .with_for_update()
                .first()
            )
            if referencia is None:
                raise RecursoNoEncontradoError(mensaje)

        aula = db.query(Aulas).filter(Aulas.id == valores["aula_id"]).first()
        if valores["cupo_maximo"] > aula.capacidad:
            raise RecursoDuplicadoError("El cupo supera la capacidad del aula")

        if excluir_id is not None:
            ocupados = db.query(Matriculas).filter(
                Matriculas.seccion_id == excluir_id,
                Matriculas.estado == "ACTIVA",
            ).count()
            if valores["cupo_maximo"] < ocupados:
                raise RecursoDuplicadoError(
                    "El cupo no puede ser menor que las matriculas activas existentes"
                )

        inicio = convertir_hora(valores["hora_inicio"])
        fin = convertir_hora(valores["hora_fin"])
        if fin <= inicio:
            raise RecursoDuplicadoError(
                "La hora de cierre debe ser posterior a la hora de inicio"
            )

        dias = normalizar_dias(valores["dias"])
        conflictos = db.query(Secciones).filter(
            Secciones.periodo_id == valores["periodo_id"],
            or_(
                Secciones.docente_id == valores["docente_id"],
                Secciones.aula_id == valores["aula_id"],
            ),
            Secciones.id != excluir_id if excluir_id is not None else True,
        ).all()

        for existente in conflictos:
            if not dias.intersection(normalizar_dias(existente.dias)):
                continue

            inicio_existente = convertir_hora(existente.hora_inicio)
            fin_existente = convertir_hora(existente.hora_fin)
            hay_traslape = inicio < fin_existente and fin > inicio_existente
            if not hay_traslape:
                continue

            if existente.docente_id == valores["docente_id"]:
                raise RecursoDuplicadoError("El docente ya tiene choque de horario")
            if existente.aula_id == valores["aula_id"]:
                raise RecursoDuplicadoError("El aula ya tiene choque de horario")

    @staticmethod
    def crear_service(db: Session, json: Revisar_Json_Crear_Seccion):
        valores = json.model_dump()
        valores["hora_inicio"] = normalizar_hora(valores["hora_inicio"])
        valores["hora_fin"] = normalizar_hora(valores["hora_fin"])
        SeccionesService._validar_registro(db, valores)
        seccion = Secciones(**valores)
        return repo.guardar_seccion_repository(db, seccion)

    @staticmethod
    def listar_service(db: Session, pagina_actual: int, limite: int):
        total, data = repo.listar_repository(db, pagina_actual, limite)
        return RespuestaPaginada[SeccionResponse](
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
            raise RecursoNoEncontradoError("No existe esta seccion")
        return check

    @staticmethod
    def editar_service(db: Session, id: int, json: Revisar_Json_Editar_Seccion):
        check = SeccionesService.buscar_service(db, id)
        valores = json.model_dump()
        valores["hora_inicio"] = normalizar_hora(valores["hora_inicio"])
        valores["hora_fin"] = normalizar_hora(valores["hora_fin"])
        SeccionesService._validar_registro(db, valores, excluir_id=id)
        for nombre, valor in valores.items():
            setattr(check, nombre, valor)
        return repo.guardar_seccion_repository(db, check)

    @staticmethod
    def editar_parcialmente_service(
        db: Session, id: int, json: Editar_Parcialmente_Seccion
    ):
        check = SeccionesService.buscar_service(db, id)
        cambios = json.model_dump(exclude_unset=True)
        valores = {
            nombre: getattr(check, nombre)
            for nombre in Revisar_Json_Editar_Seccion.model_fields
        }
        valores.update(cambios)
        valores["hora_inicio"] = normalizar_hora(valores["hora_inicio"])
        valores["hora_fin"] = normalizar_hora(valores["hora_fin"])
        SeccionesService._validar_registro(db, valores, excluir_id=id)
        for nombre, valor in cambios.items():
            setattr(check, nombre, valores[nombre])
        return repo.guardar_seccion_repository(db, check)

    @staticmethod
    def eliminar_service(db: Session, id: int):
        check = SeccionesService.buscar_service(db, id)
        repo.eliminar_seccion_repository(db, check)
