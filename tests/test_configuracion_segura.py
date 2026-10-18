from pydantic import SecretStr, ValidationError
import pytest

from core.config import Settings, preparar_url_base_datos


CLAVE_PRODUCCION = "r4nd0m-ESTA-clave-segura-2026-sin-reutilizar"
URL_POSTGRES = "postgresql+psycopg://usuario:contrasena@db.example.test:5432/campusflow"


def test_produccion_exige_clave_segura_https_cookie_y_postgresql():
    settings = Settings(
        _env_file=None,
        APP_ENV="production",
        DATABASE_URL=URL_POSTGRES,
        SECRET_KEY=CLAVE_PRODUCCION,
        FRONTEND_ORIGINS="https://campus.example.test",
    )

    assert settings.cookie_secure is True
    assert "sslmode=require" in preparar_url_base_datos(
        settings.DATABASE_URL.get_secret_value(), settings.APP_ENV
    )


@pytest.mark.parametrize(
    "cambios",
    [
        {"SECRET_KEY": "clave-de-prueba"},
        {"COOKIE_SECURE": False},
        {"COOKIE_SAMESITE": "none", "COOKIE_SECURE": False},
        {"FRONTEND_ORIGINS": "http://campus.example.test"},
        {"FRONTEND_ORIGINS": "https://localhost:5173"},
        {"FRONTEND_ORIGINS": "https://127.0.0.1:5173"},
        {"FRONTEND_ORIGINS": "https://campus.example.test/app"},
        {"DATABASE_URL": "sqlite:///./campusflow.db"},
    ],
)
def test_produccion_rechaza_configuracion_insegura(cambios):
    valores = {
        "_env_file": None,
        "APP_ENV": "production",
        "DATABASE_URL": URL_POSTGRES,
        "SECRET_KEY": CLAVE_PRODUCCION,
        "FRONTEND_ORIGINS": "https://campus.example.test",
    }
    valores.update(cambios)

    with pytest.raises(ValidationError):
        Settings(**valores)


def test_secretos_no_se_muestran_en_la_representacion_de_settings():
    clave = "clave-super-secreta-no-imprimir-2026"
    contrasena_db = "password-db-que-no-debe-aparecer"
    contrasena_smtp = "password-smtp-que-no-debe-aparecer"
    settings = Settings(
        _env_file=None,
        DATABASE_URL=f"postgresql+psycopg://usuario:{contrasena_db}@db.example.test/campus",
        SECRET_KEY=clave,
        SMTP_PASSWORD=contrasena_smtp,
    )
    representacion = repr(settings)

    assert clave not in representacion
    assert contrasena_db not in representacion
    assert contrasena_smtp not in representacion
    assert isinstance(settings.SECRET_KEY, SecretStr)


def test_tls_no_modifica_conexiones_de_desarrollo_ni_baja_verificacion_existente():
    assert preparar_url_base_datos(URL_POSTGRES, "development") == URL_POSTGRES

    url_verificada = f"{URL_POSTGRES}?sslmode=verify-full"
    assert preparar_url_base_datos(url_verificada, "production") == url_verificada
