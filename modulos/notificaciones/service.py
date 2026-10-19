from sqlalchemy.orm import Session

from core.excepciones import RecursoNoEncontradoError
from modulos.notificaciones import repository as repo


def listar_notificaciones_docentes(db: Session, administrador_id: int):
    filas = repo.listar_cambios_docentes(db, administrador_id)
    return [
        {
            "id": evento.id,
            "usuario": evento.usuario,
            "accion": evento.accion,
            "modulo": evento.modulo,
            "registro_id": evento.registro_id,
            "descripcion": evento.descripcion,
            "fecha": evento.fecha,
            "leida": evento_id is not None,
        }
        for evento, evento_id in filas
    ]


def marcar_notificacion_leida(db: Session, administrador_id: int, evento_id: int) -> None:
    if repo.buscar_cambio_docente(db, evento_id) is None:
        raise RecursoNoEncontradoError("No existe esa notificacion de actividad docente.")
    if repo.notificacion_leida(db, administrador_id, evento_id):
        return
    repo.guardar_notificacion_leida(db, administrador_id, evento_id)
