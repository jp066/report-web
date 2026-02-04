from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.schemas.login_schema import Usuario
from app.schemas.env_schema import Settings
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Usuario:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        nome = payload.get("nome") or ""
        usuario_id: str | None = payload.get("sub")
        email: str | None = payload.get("email")
        if usuario_id is None or email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Não foi possível validar as credenciais.",
            )
        return Usuario(id=usuario_id, email=email, nome=nome)
    except JWTError as e:
        raise HTTPException(
            detail=str(e),
            status_code=status.HTTP_401_UNAUTHORIZED,
#            detail="Não foi possível validar as credenciais.",
        )


async def get_current_user_refresh(token: str = Depends(oauth2_scheme)) -> Usuario:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        nome = payload.get("nome") or ""
        usuario_id: str | None = payload.get("sub")
        email: str | None = payload.get("email")
        if usuario_id is None or email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Não foi possível validar as credenciais.",
            )
        return Usuario(id=usuario_id, email=email, nome=nome)
    except JWTError as e:
        raise HTTPException(
            detail=str(e),
            status_code=status.HTTP_401_UNAUTHORIZED
        )