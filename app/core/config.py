from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "FastAPI App"

settings = Settings()
