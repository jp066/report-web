from app.auth.two_factor_auth import verify_2fa_token
from fastapi.responses import FileResponse
from bcrypt import checkpw, hashpw, gensalt
from app.schemas.login_schema import LoginRequest, LoginResponse, UsuarioDb, TokenReq, ForgotPasswordRequest
from pydantic import BaseModel
from datetime import timedelta
import os
from fastapi import Form, HTTPException, Depends
from sqlalchemy.orm import Session
from app.dependecy.database import get_db
from app.auth.security import create_acess_token
from app.dependecy.authVerify import get_current_user, get_current_user_refresh
from app.auth.two_factor_auth import gen_qrCode_user, gen_saved_secret
from . import authRouter
from app.services.get_user import get_usuario_by_email
from app.services.email_service import send_password_reset_email
from jose import jwt, JWTError
import logging
logger = logging.getLogger("uvicorn.error")


@authRouter.post("/login", response_model=LoginResponse)
def login(login_request: LoginRequest, db: Session = Depends(get_db)):
    logger.info(f"Tentando login para email: {login_request.email}")
    usuario: UsuarioDb = get_usuario_by_email(db, login_request.email)
    logger.info(f"Usuário retornado: {usuario}")
    if not usuario:
        logger.warning("Usuário não encontrado.")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if usuario.email == login_request.email:
        logger.info("Email encontrado, verificando senha...")
        if checkpw(login_request.senha.encode('utf-8'), usuario.senha.encode('utf-8')):
            logger.info("Senha correta. Gerando tokens...")
            access_token = create_acess_token(
                {"sub": usuario.id, "email": usuario.email, "nome": usuario.nome}, expires_delta=timedelta(minutes=15))
            refresh_token = create_acess_token(
                {"sub": usuario.id, "email": usuario.email, "nome": usuario.nome}, expires_delta=timedelta(days=7))
            logger.info("Login bem-sucedido.")
            return LoginResponse(
                usuario={"nome": usuario.nome, "email": usuario.email},
                access_token=access_token,
                refresh_token=refresh_token)
        else:
            logger.warning("Senha incorreta.")
            raise HTTPException(
                status_code=401, detail="Invalid credentials")
    logger.warning("Email não bate com o usuário retornado.")
    raise HTTPException(status_code=401, detail="Invalid credentials")

@authRouter.post("/signup", response_model=LoginResponse)
async def signup(signup_request: LoginRequest, db: Session = Depends(get_db)):
    logger.info(f"Tentando cadastro para email: {signup_request.email}")
    existing_user = get_usuario_by_email(db, signup_request.email)
    if existing_user:
        logger.warning("Email já cadastrado.")
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    hashed_password = hashpw(signup_request.senha.encode('utf-8'), gensalt())
    new_user = UsuarioDb(nome=signup_request.nome, email=signup_request.email, senha=hashed_password.decode('utf-8'))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info("Usuário cadastrado com sucesso. Gerando tokens...")
    access_token = create_acess_token(
        {"sub": new_user.id, "email": new_user.email, "nome": new_user.nome}, expires_delta=timedelta(minutes=15))
    refresh_token = create_acess_token(
        {"sub": new_user.id, "email": new_user.email, "nome": new_user.nome}, expires_delta=timedelta(days=7))

    logger.info("Cadastro bem-sucedido.")
    return LoginResponse(
        usuario={"nome": new_user.nome, "email": new_user.email},
        access_token=access_token,
        refresh_token=refresh_token)

@authRouter.post("/refresh", response_model=LoginResponse)
async def refresh_token(current_user: UsuarioDb = Depends(get_current_user_refresh)):
    access_token = create_acess_token({
        "sub": current_user.id,
        "email": current_user.email,
        "nome": current_user.nome},
        expires_delta=timedelta(minutes=15))
    refresh_token = create_acess_token({
        "sub": current_user.id,
        "email": current_user.email,
        "nome": current_user.nome},
        expires_delta=timedelta(days=7))

    return LoginResponse(
        usuario={"nome": current_user.nome, "email": current_user.email},
        access_token=access_token,
        refresh_token=refresh_token)


@authRouter.get("/me")
async def read_users_me(current_user: UsuarioDb = Depends(get_current_user)):
    id, nome, email = current_user.id, current_user.nome, current_user.email
    return {"id": id, "nome": nome, "email": email}


@authRouter.get("/2fa/qrcode")
async def get_qrcode(current_user: UsuarioDb = Depends(get_current_user), db: Session = Depends(get_db)):
    usuario = get_usuario_by_email(db=db, email=current_user.email)

    if not usuario.email.endswith("@brightbee.com.br"):
        raise HTTPException(
            status_code=403,
            detail="Apenas emails corporativos (@brightbee.com.br) podem usar autenticação de dois fatores."
        )

    secret = gen_saved_secret(usuario, db)

    # Usa caminho absoluto para o arquivo QR Code
    base_dir = os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    qrcode_path = os.path.join(base_dir, "qrcodes", f"{usuario.id}_qrcode.png")

    logger.info(f"Procurando QR Code em: {qrcode_path}")

    if isinstance(secret, str) and secret == "Segredo já existe para este usuário.":
        if not os.path.exists(qrcode_path):
            logger.info(f"QR Code não encontrado, gerando novo...")
            result = gen_qrCode_user(usuario, str(usuario.id))
            if result is False:
                raise HTTPException(
                    status_code=500, detail="Erro ao gerar QR Code")
        return FileResponse(qrcode_path, media_type="image/png")
    else:
        logger.info(f"Gerando novo secret e QR Code...")
        result = gen_qrCode_user(usuario, str(usuario.id))
        if result is False:
            raise HTTPException(
                status_code=500, detail="Erro ao gerar QR Code")
        return FileResponse(qrcode_path, media_type="image/png")


@authRouter.post("/2fa/validate")
async def validate_2fa(token: TokenReq, current_user: UsuarioDb = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Iniciando validação 2FA para usuário: {current_user.email}")
    usuario = get_usuario_by_email(db=db, email=current_user.email)

    if not usuario:
        logger.error(f"Usuário não encontrado: {current_user.email}")
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    logger.info(
        f"Validando token 2FA: {token.token[:3]}*** para usuário {usuario.email}")
    is_valid = verify_2fa_token(usuario, token.token)

    if not is_valid:
        logger.warning(f"Token 2FA inválido para usuário: {usuario.email}")
        raise HTTPException(
            status_code=401, detail="Código inválido ou expirado")

    logger.info(f"Token 2FA válido para usuário: {usuario.email}")
    return {"message": "2FA token válido"}


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@authRouter.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = request.email
    usuario: UsuarioDb = get_usuario_by_email(db, email)
    if not usuario:
        logger.info(
            f"Esqueci minha senha solicitado para email inexistente: {email}")
        return {"message": "Email inexistente."}

    # Gera token JWT com expiração de 1 hora
    reset_token = create_acess_token(
        {"sub": usuario.id, "email": usuario.email, "purpose": "password_reset"},
        expires_delta=timedelta(hours=1)
    )

    # Envia email com o token
    send_password_reset_email(email, reset_token)
    logger.info(f"Esqueci minha senha solicitado para email: {email}")
    return {"message": "Se o email existir em nosso sistema, você receberá instruções para alterar a senha."}


@authRouter.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        # Decodifica e valida o token
        from app.schemas.env_schema import settings
        payload = jwt.decode(request.token, settings.SECRET_KEY,
                             algorithms=[settings.ALGORITHM])

        email = payload.get("email")
        purpose = payload.get("purpose")

        if not email or purpose != "password_reset":
            raise HTTPException(status_code=400, detail="Token inválido")

        # Busca o usuário
        usuario = get_usuario_by_email(db, email)
        if not usuario:
            raise HTTPException(
                status_code=404, detail="Usuário não encontrado")

        # Valida a nova senha
        if len(request.new_password) < 8:
            raise HTTPException(
                status_code=400, detail="A senha deve ter no mínimo 8 caracteres")

        # Atualiza a senha (hash bcrypt)
        hashed_password = hashpw(
            request.new_password.encode('utf-8'), gensalt())
        usuario.senha = hashed_password.decode('utf-8')
        db.commit()

        logger.info(f"Senha redefinida com sucesso para o email: {email}")
        return {"message": "Senha alterada com sucesso"}

    except JWTError:
        raise HTTPException(
            status_code=400, detail="Token inválido ou expirado")
    except Exception as e:
        logger.error(f"Erro ao redefinir senha: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao redefinir senha")
