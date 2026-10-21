from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database.almacen import abrir_puerta_bd
from modulos.documentos.schema import VerificacionDocumento
from modulos.documentos.service import constancia_estudiantil, constancia_laboral, guardar_logo, historial_academico, leer_logo, verificar_documento as verificar_folio
from modulos.suscripciones.dependencias import exigir_suscripcion
from utils.auth import permiso_admin


router = APIRouter(prefix="/documentos", tags=["Documentos"])


@router.get("/logo")
def logo_institucional(db: Session = Depends(abrir_puerta_bd)):
    contenido = leer_logo(db)
    if contenido is None:
        raise HTTPException(status_code=404, detail="Logo no configurado")
    return Response(content=contenido, media_type="image/png", headers={"Cache-Control": "no-store"})


@router.put("/logo")
async def actualizar_logo(
    request: Request,
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    if request.headers.get("content-type", "").split(";", 1)[0].lower() not in {"image/png", "image/jpeg"}:
        raise HTTPException(status_code=415, detail="Usa un logo PNG o JPG")
    contenido = bytearray()
    async for parte in request.stream():
        contenido.extend(parte)
        if len(contenido) > 2 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="El logo no puede superar 2 MB")
    guardar_logo(db, bytes(contenido))
    return {"configurado": True}


@router.get("/historial-academico/{estudiante_id}/vista-previa", dependencies=[Depends(exigir_suscripcion)])
def previsualizar_historial(
    estudiante_id: int,
    db: Session = Depends(abrir_puerta_bd),
    administrador: dict = Depends(permiso_admin),
):
    contenido, _ = historial_academico(db, estudiante_id, administrador["user_id"], emitir=False)
    return Response(content=contenido, media_type="application/pdf", headers={"Cache-Control": "no-store"})


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


@router.get("/constancia-laboral/{docente_id}/vista-previa", dependencies=[Depends(exigir_suscripcion)])
def previsualizar_constancia_laboral(docente_id: int, db: Session = Depends(abrir_puerta_bd), administrador: dict = Depends(permiso_admin)):
    contenido, _ = constancia_laboral(db, docente_id, administrador["user_id"], emitir=False)
    return Response(content=contenido, media_type="application/pdf", headers={"Cache-Control": "no-store"})


@router.get("/constancia-estudiantil/{estudiante_id}/vista-previa", dependencies=[Depends(exigir_suscripcion)])
def previsualizar_constancia_estudiantil(estudiante_id: int, db: Session = Depends(abrir_puerta_bd), administrador: dict = Depends(permiso_admin)):
    contenido, _ = constancia_estudiantil(db, estudiante_id, administrador["user_id"], emitir=False)
    return Response(content=contenido, media_type="application/pdf", headers={"Cache-Control": "no-store"})


@router.post("/constancia-estudiantil/{estudiante_id}", dependencies=[Depends(exigir_suscripcion)])
def emitir_constancia_estudiantil(estudiante_id: int, db: Session = Depends(abrir_puerta_bd), administrador: dict = Depends(permiso_admin)):
    contenido, nombre = constancia_estudiantil(db, estudiante_id, administrador["user_id"])
    return Response(content=contenido, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{nombre}"'})


@router.get("/verificar/{folio}", response_model=VerificacionDocumento)
def verificar_documento(folio: str, db: Session = Depends(abrir_puerta_bd)):
    return verificar_folio(db, folio)
