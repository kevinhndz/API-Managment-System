from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.excepciones import RecursoNoEncontradoError
from modulos.notificaciones import repository as repo


def listar_notificaciones_docentes(db: Session, administrador_id: int):
    return repo.listar_cambios_docentes(db, administrador_id)


def marcar_notificacion_leida(db: Session, administrador_id: int, evento_id: int) -> None:
    if repo.buscar_cambio_docente(db, evento_id) is None:
        raise RecursoNoEncontradoError("No existe esa notificacion de actividad docente.")
    if repo.notificacion_leida(db, administrador_id, evento_id):
        return
    try:
        repo.guardar_notificacion_leida(db, administrador_id, evento_id)
    except IntegrityError:
        db.rollback()
