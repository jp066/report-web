import logging
from app.dependecy.database import SessionLocal
import httpx
from app.models.usuarios import Usuarios


def get_usuarios(db):
    session = db
    try:
        usuarios = session.query(Usuarios).all()
        return usuarios
    finally:
        session.close()


logger = logging.getLogger("uvicorn.error")


def get_usuario_by_email(db, email: str):
    session = db
    usuario = session.query(Usuarios).filter(Usuarios.email == email).first()
    logger.info(f"get_usuario_by_email: email={email}, usuario={usuario}")
    return usuario