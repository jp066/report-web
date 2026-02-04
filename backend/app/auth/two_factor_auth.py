from app.dependecy.database import SessionLocal
import os
from app.models.usuarios import Usuarios
import qrcode
import pyotp
import logging
logger = logging.getLogger("uvicorn.error")


def existence_secret(usuario: Usuarios) -> bool:
    if usuario.otp_segredo is not None:
        return True


def gen_saved_secret(usuario: Usuarios, db):
    if existence_secret(usuario):
        logger.info("Segredo já existe para este usuário.")
        return "Segredo já existe para este usuário."
    otp_secret = pyotp.random_base32()
    usuario.otp_segredo = otp_secret
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return otp_secret


def gen_qrCode_user(usuario: Usuarios, token: str) -> bool:
    if not usuario.otp_segredo:
        logger.error("Usuário não possui segredo OTP.")
        return False
    totp = pyotp.TOTP(usuario.otp_segredo)
    if not usuario.email.endswith("@brightbee.com.br"):
        logger.warning("Apenas emails Bright Bee são permitidos para 2FA.")
        return False

    try:
        uri = totp.provisioning_uri(
            name=usuario.email, issuer_name="Bright Bee School - Sistema de Relatórios")
        img = qrcode.make(uri)

        # Usa caminho absoluto a partir do diretório atual
        base_dir = os.path.dirname(os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))))
        qrcode_dir = os.path.join(base_dir, "qrcodes")
        os.makedirs(qrcode_dir, exist_ok=True)

        qrcode_path = os.path.join(qrcode_dir, f"{token}_qrcode.png")
        img.save(qrcode_path)
        logger.info(f"QR Code gerado com sucesso em: {qrcode_path}")
        return True
    except Exception as e:
        logger.error(f"Erro ao gerar QR Code: {str(e)}")
        return False


def verify_2fa_token(usuario: Usuarios, token: str) -> bool:
    if not usuario.otp_segredo:
        logger.warning("Usuário não possui segredo 2FA salvo.")
        return False
    totp = pyotp.TOTP(usuario.otp_segredo)
    # Permite uma janela de 2 períodos (1 minuto antes e 1 minuto depois)
    is_valid = totp.verify(token, valid_window=2)
    logger.info(
        f"Validação 2FA - Token: {token}, Válido: {is_valid}, Código esperado: {totp.now()}")
    return is_valid
