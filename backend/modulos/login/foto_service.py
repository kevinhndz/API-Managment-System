from collections.abc import AsyncIterable

from sqlalchemy.orm import Session

from core.excepciones import ArchivoPerfilInvalidoError, RecursoNoEncontradoError
from modulos.login.foto_repository import FotoPerfilRepository as archivos
from modulos.login.repository import UsuarioRepository as repo
from modulos.login.schema import PerfilUsuarioResponse


LIMITE_FOTO = 5 * 1024 * 1024
TIPOS_FOTO = {
    "image/jpeg": (".jpg", b"\xff\xd8\xff"),
    "image/png": (".png", b"\x89PNG\r\n\x1a\n"),
    "image/webp": (".webp", b"RIFF"),
}


async def actualizar_foto_perfil(
    db: Session, usuario_id: int, tipo: str, longitud: str | None,
    partes: AsyncIterable[bytes],
) -> PerfilUsuarioResponse:
    tipo = tipo.split(";", 1)[0].strip().lower()
    if tipo not in TIPOS_FOTO:
        raise ArchivoPerfilInvalidoError("Usa una imagen JPG, PNG o WebP.", 415)
    if longitud:
        try:
            cantidad = int(longitud)
        except ValueError as error:
            raise ArchivoPerfilInvalidoError("El tamaño del archivo no es válido.", 400) from error
        if cantidad > LIMITE_FOTO:
            raise ArchivoPerfilInvalidoError("La foto debe pesar hasta 5 MB.", 413)

    contenido_partes = []
    bytes_recibidos = 0
    async for parte in partes:
        bytes_recibidos += len(parte)
        if bytes_recibidos > LIMITE_FOTO:
            raise ArchivoPerfilInvalidoError("La foto debe pesar hasta 5 MB.", 413)
        contenido_partes.append(parte)
    contenido = b"".join(contenido_partes)
    if not contenido:
        raise ArchivoPerfilInvalidoError("El archivo de imagen está vacío.", 400)
    extension, firma = TIPOS_FOTO[tipo]
    if not contenido.startswith(firma):
        raise ArchivoPerfilInvalidoError("El archivo no coincide con el tipo de imagen indicado.", 415)
    if tipo == "image/webp" and contenido[8:12] != b"WEBP":
        raise ArchivoPerfilInvalidoError("El archivo WebP no es válido.", 415)

    registro = repo.buscar_por_id_repository(db, usuario_id)
    if registro is None:
        raise RecursoNoEncontradoError("No se encontro la cuenta.")
    foto_anterior = registro.foto
    foto_nueva = archivos.guardar(contenido, extension)
    try:
        registro.foto = foto_nueva
        registro = repo.guardar_cambios_perfil_repository(db, registro)
    except Exception:
        archivos.eliminar(foto_nueva)
        raise
    archivos.eliminar(foto_anterior)
    return PerfilUsuarioResponse(
        nombre=registro.nombre or registro.usuario, correo=registro.correo, foto=registro.foto,
    )
