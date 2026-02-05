from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_name: str
    db_user: str
    db_password: str
    db_host: str
    db_port: str
    db_driver: str
    TOTVS_URL: str
    TOTVS_USERNAME: str
    TOTVS_PASSWORD: str
    AUTH_HARDCODED: str
    SOAP_VERIFY_SSL: bool
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()