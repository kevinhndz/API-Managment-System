from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from modulos.documentos.schema import VerificacionDocumento
from modulos.documentos.service import constancia_laboral, historial_academico, verificar_documento as verificar_folio
from modulos.suscripciones.dependencias import exigir_suscripcion
from utils.auth import permiso_admin


router = APIRouter(prefix="/documentos", tags=["Documentos"])


@router.post("/historial-academico/{estudiante_id}", dependencies=[Depends(exigir_suscripcion)])
def emitir_historial(
    estudiante_id: int,
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    contenido, nombre = historial_academico(db, estudiante_id, administrador["user_id"])
    return Response(content=contenido, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{nombre}"'})


@router.post("/constancia-laboral/{docente_id}", dependencies=[Depends(exigir_suscripcion)])
def emitir_constancia(
    docente_id: int,
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    contenido, nombre = constancia_laboral(db, docente_id, administrador["user_id"])
    return Response(content=contenido, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{nombre}"'})


@router.get("/verificar/{folio}", response_model=VerificacionDocumento)
def verificar_documento(folio: str, db: Session = Depends(abrir_puerta_bd)):
    return verificar_folio(db, folio)
