import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger('uvicorn.error')

SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', 'sistemas@brightbee.com.br')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', 'hkrt vawp cqux sane')
FROM_EMAIL = os.getenv('FROM_EMAIL', SMTP_USER)
FROM_NAME = os.getenv('FROM_NAME', 'Sistema de Relatórios BBS')


def send_email(email: str, subject: str, body_html: str, body_text: str = None):
    try:
        if not SMTP_USER or not SMTP_PASSWORD:
            print('Erro: Credenciais SMTP não configuradas')
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f'{FROM_NAME} <{FROM_EMAIL}>'
        msg['To'] = email
        
        if body_text:
            part1 = MIMEText(body_text, 'plain', 'utf-8')
            msg.attach(part1)
        
        part2 = MIMEText(body_html, 'html', 'utf-8')
        msg.attach(part2)
        
        print(f'Conectando ao servidor SMTP {SMTP_HOST}:{SMTP_PORT}')
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f'Email enviado com sucesso para {email}')
        return True
        
    except Exception as e:
        print(f'Erro ao enviar email: {str(e)}')
        return False


def send_password_reset_email(email: str, reset_token: str | None = None):
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    reset_link = f'{FRONTEND_URL}/reset-password?token={reset_token}'
    subject = 'Recuperação de Senha - Sistema de Relatórios BBS'
    body_html = f'''
    <html>
    <body style="font-family: Arial; padding: 20px;">
        <h2>Recuperação de Senha</h2>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <p><a href="{reset_link}" style="background:#667eea;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Redefinir Senha</a></p>
        <p>Este link expira em 1 hora.</p>
        <p>Bright Bee  2025</p>
    </body>
    </html>
    '''
    body_text = f'Recuperação de Senha\n\nAcesse: {reset_link}\n\nExpira em 1 hora.\n\nBright Bee  2025'
    print(f'Enviando email de recuperação de senha para {email}')
    print('=' * 60)
    print(f"Subject: {subject}")
    print(f"body_text: {body_text}")
    return send_email(email, subject, body_html, body_text)


if __name__ == '__main__':
    print('=' * 60)
    print('TESTE DE ENVIO DE EMAIL')
    print('=' * 60)
    success = send_password_reset_email('joaomatos@brightbee.com.br', 'token-teste-123')
    print('=' * 60)
    if success:
        print('Email enviado com sucesso!')
    else:
        print('Falha ao enviar email')