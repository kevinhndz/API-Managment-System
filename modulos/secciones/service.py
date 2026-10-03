from math import ceil
from sqlalchemy.orm import Session
from core.excepciones import RecursoDuplicadoError, RecursoNoEncontradoError
from core.schema import RespuestaPaginada
from modulos.aulas.tabla import Aulas
from modulos.secciones.repository import SeccionRepository as repo
from modulos.secciones.schema import *
from modulos.secciones.tabla import Secciones

class SeccionesService:
    @staticmethod
    def crear_service(db: Session, json: Revisar_Json_Crear_Seccion):
        check = repo.check_repository(db, json)
        if check is not None: raise RecursoDuplicadoError("Ya existe esta seccion")
        aula = db.query(Aulas).filter(Aulas.id == json.aula_id).first()
        if aula is None: raise RecursoNoEncontradoError("No existe esta aula")
        if json.cupo_maximo > aula.capacidad: raise RecursoDuplicadoError("El cupo supera la capacidad del aula")
        choque = db.query(Secciones).filter(Secciones.periodo_id == json.periodo_id, Secciones.docente_id == json.docente_id, Secciones.dias == json.dias, Secciones.hora_inicio < json.hora_fin, Secciones.hora_fin > json.hora_inicio).first()
        if choque is not None: raise RecursoDuplicadoError("El docente ya tiene choque de horario")
        choque = db.query(Secciones).filter(Secciones.periodo_id == json.periodo_id, Secciones.aula_id == json.aula_id, Secciones.dias == json.dias, Secciones.hora_inicio < json.hora_fin, Secciones.hora_fin > json.hora_inicio).first()
        if choque is not None: raise RecursoDuplicadoError("El aula ya tiene choque de horario")
        seccion = Secciones(codigo=json.codigo, asignatura_id=json.asignatura_id, docente_id=json.docente_id, periodo_id=json.periodo_id, aula_id=json.aula_id, dias=json.dias, hora_inicio=json.hora_inicio, hora_fin=json.hora_fin, cupo_maximo=json.cupo_maximo, estado=json.estado)
        return repo.guardar_seccion_repository(db, seccion)
    @staticmethod
    def listar_service(db: Session, pagina_actual: int, limite: int):
        total, data = repo.listar_repository(db, pagina_actual, limite)
        return RespuestaPaginada[SeccionResponse](total=total, pagina_actual=pagina_actual, limite=limite, total_paginas=ceil(total / limite) if total else 0, data=data)
    @staticmethod
    def buscar_service(db: Session, id: int):
        check = repo.buscar_repository(db, id)
        if check is None: raise RecursoNoEncontradoError("No existe esta seccion")
        return check
    @staticmethod
    def editar_service(db: Session, id: int, json: Revisar_Json_Editar_Seccion):
        check = SeccionesService.buscar_service(db, id)
        repo_check = repo.check_repository(db, json)
        if repo_check is not None and repo_check.id != id: raise RecursoDuplicadoError("Ya existe esta seccion")
        aula = db.query(Aulas).filter(Aulas.id == json.aula_id).first()
        if aula is None: raise RecursoNoEncontradoError("No existe esta aula")
        if json.cupo_maximo > aula.capacidad: raise RecursoDuplicadoError("El cupo supera la capacidad del aula")
        check.codigo=json.codigo; check.asignatura_id=json.asignatura_id; check.docente_id=json.docente_id; check.periodo_id=json.periodo_id; check.aula_id=json.aula_id; check.dias=json.dias; check.hora_inicio=json.hora_inicio; check.hora_fin=json.hora_fin; check.cupo_maximo=json.cupo_maximo; check.estado=json.estado
        return repo.guardar_seccion_repository(db, check)
    @staticmethod
    def editar_parcialmente_service(db: Session, id: int, json: Editar_Parcialmente_Seccion):
        check = SeccionesService.buscar_service(db, id)
        if json.codigo is not None: check.codigo=json.codigo
        if json.asignatura_id is not None: check.asignatura_id=json.asignatura_id
        if json.docente_id is not None: check.docente_id=json.docente_id
        if json.periodo_id is not None: check.periodo_id=json.periodo_id
        if json.aula_id is not None: check.aula_id=json.aula_id
        if json.dias is not None: check.dias=json.dias
        if json.hora_inicio is not None: check.hora_inicio=json.hora_inicio
        if json.hora_fin is not None: check.hora_fin=json.hora_fin
        if json.cupo_maximo is not None: check.cupo_maximo=json.cupo_maximo
        if json.estado is not None: check.estado=json.estado
        return repo.guardar_seccion_repository(db, check)
    @staticmethod
    def eliminar_service(db: Session, id: int):
        check=SeccionesService.buscar_service(db,id); repo.eliminar_seccion_repository(db,check)
