from pydantic import BaseSettings
from app.schemas.env_schema import settings as env_settings

__all__ = ["settings"] # Torna as configurações disponíveis globalmente
class Settings(BaseSettings):
    APP_NAME: str = "API Report Web Bright Bee School"

settings = Settings()