from sqlalchemy.orm import Session

from modulos.estudiantes.tabla import Estudiantes


# Cuenta solamente los estudiantes que tienen estado activo.
def contar_estudiantes_activos(db: Session) -> dict:
    # Cuenta filas sin traer todos los estudiantes a memoria.
    total = db.query(Estudiantes).filter(Estudiantes.estado.is_(True)).count()
    # Devuelve un resultado pequeno y claro para el agente.
    return {"total": total, "filtro": "activos"}
