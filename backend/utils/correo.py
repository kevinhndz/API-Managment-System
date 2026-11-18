import smtplib
from email.message import EmailMessage

from core.config import settings


def enviar_correo(destinatario: str, asunto: str, contenido: str) -> None:
    if not all((settings.SMTP_HOST, settings.SMTP_USER, settings.smtp_password, settings.SMTP_FROM)):
        raise RuntimeError("El envio de correo no esta configurado.")

    mensaje = EmailMessage()
    mensaje["Subject"] = asunto
    mensaje["From"] = settings.SMTP_FROM
    mensaje["To"] = destinatario
    mensaje.set_content(contenido)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as servidor:
        if settings.SMTP_STARTTLS:
            servidor.starttls()
        servidor.login(settings.SMTP_USER, settings.smtp_password)
        servidor.send_message(mensaje)
