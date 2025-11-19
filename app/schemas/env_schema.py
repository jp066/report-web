from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DEBUG: bool = False
    TOTVS_USERNAME: str
    TOTVS_PASSWORD: str
    AUTH_HARDCODED: str
    TOTVS_URL: str
    SOAP_VERIFY_SSL: bool = True


    model_config = {"env_file": ".env"}

settings = Settings()