from sqlalchemy.orm import Session

from modulos.suscripciones.tabla import Suscripciones


def obtener_por_institucion(db: Session, institucion_id: int) -> Suscripciones | None:
    return db.query(Suscripciones).filter(
        Suscripciones.institucion_id == institucion_id
    ).one_or_none()
