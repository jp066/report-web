from sqlalchemy import Column, String, DateTime, Integer
from app.dependecy.database import Base
from datetime import datetime

class Usuarios(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    senha = Column(String(255), nullable=False)
    otp_segredo = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)