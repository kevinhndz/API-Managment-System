from ipaddress import ip_address
from typing import Literal
from urllib.parse import urlsplit

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url

class Settings(BaseSettings):
    APP_ENV: Literal["development", "test", "production"] = "development"
    DATABASE_URL: SecretStr
    SECRET_KEY: SecretStr
    FRONTEND_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    COOKIE_SECURE: bool | None = None
    COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: SecretStr = SecretStr("")
    SMTP_FROM: str = ""
    SMTP_STARTTLS: bool = True
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: int = 900
    LOGIN_RATE_LIMIT_IDENTITY_ATTEMPTS: int = 5
    LOGIN_RATE_LIMIT_IP_ATTEMPTS: int = 100
    LOGIN_RATE_LIMIT_BASE_LOCK_SECONDS: int = 30
    LOGIN_RATE_LIMIT_MAX_LOCK_SECONDS: int = 1800
    SIGNUP_RATE_LIMIT_WINDOW_SECONDS: int = 900
    SIGNUP_RATE_LIMIT_IP_ATTEMPTS: int = 10
    RECOVERY_RATE_LIMIT_WINDOW_SECONDS: int = 900
    RECOVERY_REQUEST_RATE_LIMIT_IP_ATTEMPTS: int = 10
    RECOVERY_CONFIRM_RATE_LIMIT_IP_ATTEMPTS: int = 20
    SIGNUP_EMAIL_CODE_TTL_MINUTES: int = 10
    SIGNUP_EMAIL_CODE_RESEND_SECONDS: int = 60
    SIGNUP_EMAIL_CODE_MAX_ATTEMPTS: int = 5
    UPLOADS_DIR: str = "uploads"

    # Configuracion de Pydantic para indicarle que lea el archivo .env automaticamente
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Ignora otras variables presentes en el .env que no estén declaradas aquí
    )

    @property
    def cookie_secure(self) -> bool:
        if self.COOKIE_SECURE is not None:
            return self.COOKIE_SECURE
        return self.APP_ENV == "production"

    @property
    def smtp_password(self) -> str:
        if isinstance(self.SMTP_PASSWORD, SecretStr):
            return self.SMTP_PASSWORD.get_secret_value()
        return self.SMTP_PASSWORD

    @model_validator(mode="after")
    def validar_configuracion_produccion(self):
        if self.COOKIE_SAMESITE == "none" and not self.cookie_secure:
            raise ValueError("COOKIE_SAMESITE=none requiere COOKIE_SECURE activado.")
        if self.APP_ENV != "production":
            return self

        clave = self.SECRET_KEY.get_secret_value()
        marcadores_inseguros = (
            "change-me",
            "changeme",
            "replace-this",
            "example",
            "clave-de-prueba",
        )
        if len(clave) < 32 or len(set(clave)) < 10 or any(
            marcador in clave.casefold() for marcador in marcadores_inseguros
        ):
            raise ValueError(
                "En producción, SECRET_KEY debe ser aleatoria y tener al menos 32 caracteres."
            )

        if not self.cookie_secure:
            raise ValueError("En producción, COOKIE_SECURE debe estar activado.")

        origenes = [origen.strip() for origen in self.FRONTEND_ORIGINS.split(",") if origen.strip()]
        if not origenes:
            raise ValueError("En producción, debes configurar el dominio del frontend.")

        for origen in origenes:
            try:
                partes = urlsplit(origen)
            except ValueError:
                partes = urlsplit("")
            host = partes.hostname
            host_local = (
                not host
                or host.casefold() == "localhost"
                or host.casefold().endswith((".localhost", ".local"))
            )
            if host:
                try:
                    host_local = host_local or ip_address(host).is_loopback
                except ValueError:
                    pass

            if (
                partes.scheme != "https"
                or not partes.netloc
                or host_local
                or partes.path
                or partes.query
                or partes.fragment
            ):
                raise ValueError(
                    "En producción, FRONTEND_ORIGINS debe contener solo dominios HTTPS públicos, sin rutas locales."
                )

        url_db = make_url(self.DATABASE_URL.get_secret_value())
        if url_db.get_backend_name() != "postgresql":
            raise ValueError("En producción, DATABASE_URL debe usar PostgreSQL.")

        return self


settings = Settings()


def preparar_url_base_datos(url: str, ambiente: str) -> str:
    """Fuerza TLS para PostgreSQL en producción sin alterar URLs locales."""
    url_db = make_url(url)
    if ambiente != "production" or url_db.get_backend_name() != "postgresql":
        return url_db.render_as_string(hide_password=False)

    opciones = dict(url_db.query)
    modo_ssl = str(opciones.get("sslmode", "")).casefold()
    if modo_ssl not in {"require", "verify-ca", "verify-full"}:
        opciones["sslmode"] = "require"
    return url_db.set(query=opciones).render_as_string(hide_password=False)
