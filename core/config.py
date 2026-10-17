from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    
    DATABASE_URL: str
    SECRET_KEY: str
    FRONTEND_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    COOKIE_SECURE: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    SMTP_STARTTLS: bool = True
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: int = 900
    LOGIN_RATE_LIMIT_IDENTITY_ATTEMPTS: int = 5
    LOGIN_RATE_LIMIT_IP_ATTEMPTS: int = 100
    LOGIN_RATE_LIMIT_BASE_LOCK_SECONDS: int = 30
    LOGIN_RATE_LIMIT_MAX_LOCK_SECONDS: int = 1800
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


settings = Settings()
