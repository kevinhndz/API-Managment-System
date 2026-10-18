# Secretos y TLS para el despliegue

## Desarrollo local

1. Copia `.env.example` como `.env`.
2. Configura tu URL de base de datos y crea una clave privada aleatoria. Puedes generar una con:

   ```powershell
   .\venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

3. `.env` está ignorado por Git. No publiques su contenido ni compartas capturas donde aparezcan sus valores.

## Producción

Configura en el panel seguro del hosting, no en el repositorio:

- `APP_ENV=production`
- `DATABASE_URL` con una conexión PostgreSQL del proveedor
- `SECRET_KEY` aleatoria, privada y de al menos 32 caracteres
- `FRONTEND_ORIGINS` con el dominio HTTPS real de la interfaz
- `COOKIE_SECURE=true`

En producción, la aplicación añade `sslmode=require` a la conexión PostgreSQL cuando la URL no pide ya `require`, `verify-ca` o `verify-full`. Alembic aplica la misma regla al ejecutar migraciones. En desarrollo local no se fuerza ese cambio.

La aplicación no termina HTTPS por sí sola: el certificado y HTTPS público deben configurarse en el hosting o proxy. `COOKIE_SECURE` impide que el navegador envíe la cookie de sesión por HTTP cuando la app está en producción.

No pegues contraseñas, URL completas ni claves en tickets, chats o logs. Si una clave real se expuso, cámbiala en el proveedor y actualiza el entorno del despliegue.
