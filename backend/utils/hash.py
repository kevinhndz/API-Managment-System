from passlib.context import CryptContext

context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def encriptar_contrasena(password: str) -> str:
    
    contrasena_hasheada = context.hash(password)
    return contrasena_hasheada


def verificar_contrasena(password: str, hash_guardado: str) -> bool:
    
    coincide = context.verify(password, hash_guardado)
    return coincide