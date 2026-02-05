from pydantic import BaseModel

class UsuarioDb(BaseModel):
    id: int
    nome: str
    email: str
    senha: str
    otp_segredo: str | None = None
    


class LoginRequest(BaseModel):
    email: str
    senha: str
    
class SignupRequest(BaseModel):
    nome: str
    contexto: str | None = None
    email: str
    senha: str

class TokenReq(BaseModel):
    token: str

class Usuario(BaseModel):
    id: str | None = None
    email: str
    nome: str
    otp_segredo: str | None = None


class LoginResponse(BaseModel):
    usuario: Usuario
    access_token: str
    refresh_token: str
    

class SignUpResponse(BaseModel):
    email: str
    password: str
    

class ForgotPasswordRequest(BaseModel):
    email: str