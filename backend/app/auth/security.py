from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.schemas.env_schema import settings
import os

SECRET_KEY = os.getenv("SECRET_KEY") or settings.SECRET_KEY
ALGORITHM = os.getenv("ALGORITHM") or settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES") or settings.ACCESS_TOKEN_EXPIRE_MINUTES)

def create_acess_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def signUp():
    pass