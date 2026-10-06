from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    
    DATABASE_URL: str
    SECRET_KEY: str

    # Configuracion de Pydantic para indicarle que lea el archivo .env automaticamente
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Ignora otras variables presentes en el .env que no estén declaradas aquí
    )


settings = Settings()
