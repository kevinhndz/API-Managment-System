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

    # Configuracion de Pydantic para indicarle que lea el archivo .env automaticamente
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Ignora otras variables presentes en el .env que no estén declaradas aquí
    )


settings = Settings()
