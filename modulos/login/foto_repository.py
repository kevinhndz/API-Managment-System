from pathlib import Path
from uuid import uuid4

from core.config import settings


class FotoPerfilRepository:
    @staticmethod
    def guardar(contenido: bytes, extension: str) -> str:
        ruta_base = Path(settings.UPLOADS_DIR).resolve() / "profiles"
        ruta_base.mkdir(parents=True, exist_ok=True)
        nombre = f"{uuid4().hex}{extension}"
        (ruta_base / nombre).write_bytes(contenido)
        return f"/uploads/profiles/{nombre}"

    @staticmethod
    def eliminar(foto: str | None) -> None:
        if foto and foto.startswith("/uploads/profiles/"):
            ruta_base = Path(settings.UPLOADS_DIR).resolve() / "profiles"
            (ruta_base / Path(foto).name).unlink(missing_ok=True)
