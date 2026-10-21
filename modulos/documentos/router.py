from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.excepciones import RecursoNoEncontradoError
from database.almacen import Instituciones, abrir_puerta_bd
from modulos.documentos.service import constancia_laboral, historial_academico
from modulos.documentos.tabla import DocumentosEmitidos
from modulos.suscripciones.service import exigir_suscripcion
from utils.auth import permiso_admin


router = APIRouter(prefix="/documentos", tags=["Documentos"])


@router.post("/historial-academico/{estudiante_id}", dependencies=[Depends(exigir_suscripcion)])
def emitir_historial(
    estudiante_id: int,
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return historial_academico(db, estudiante_id, administrador["user_id"])


@router.post("/constancia-laboral/{docente_id}", dependencies=[Depends(exigir_suscripcion)])
def emitir_constancia(
    docente_id: int,
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    return constancia_laboral(db, docente_id, administrador["user_id"])


@router.get("/verificar/{folio}")
def verificar_documento(folio: str, db: Session = Depends(abrir_puerta_bd)):
    documento = db.query(DocumentosEmitidos).filter(
        DocumentosEmitidos.folio == folio,
        DocumentosEmitidos.institucion_id == db.info["institucion_id"],
    ).one_or_none()
    if documento is None:
        raise RecursoNoEncontradoError("Documento no encontrado")
    institucion = db.get(Instituciones, db.info["institucion_id"])
    return {
        "folio": documento.folio,
        "tipo": documento.tipo,
        "institucion": institucion.nombre,
        "emitido_en": documento.emitido_en,
        "hash_pdf": documento.hash_pdf,
    }
