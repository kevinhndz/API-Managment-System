from core.config import settings as traer
from jose import jwt, JWTError
from datetime import datetime, timezone, timedelta
from core.excepciones import CredencialesInvalidasError

LLAVE = traer.SECRET_KEY

def crear_token(user: str, user_id: int, rol: str, version_token: int = 0) -> str:
    
    expira_en = datetime.now(timezone.utc) + timedelta(minutes = 30)
    
    datos = {
        "user": user,
        "user_id": user_id,
        "rol" : rol,
        "version_token": version_token,
        "iat": datetime.now(timezone.utc),
        "tipo": "acceso",
        "exp": expira_en
    }
    
    token = jwt.encode(datos, LLAVE, algorithm= "HS256")
    return token



def verificar_token(token: str) -> dict:
    
    try:
        data = jwt.decode(token, LLAVE, algorithms=["HS256"])
        if not all(data.get(clave) for clave in ("user", "user_id", "rol")):
            raise CredencialesInvalidasError("Sesion invalida")
        return data
    except JWTError:
        raise CredencialesInvalidasError("Sesion expirada o invalida")
        
