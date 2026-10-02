from core.config import settings as traer
from jose import jwt, JWTError
from datetime import datetime, timezone, timedelta
from core.excepciones import AccesoProhibidoError

LLAVE = traer.SECRET_KEY

def crear_token(user: str, user_id: int, rol: str) -> str:
    
    expira_en = datetime.now(timezone.utc) + timedelta(minutes = 30)
    
    datos = {
        "user": user,
        "user_id": user_id,
        "rol" : rol,
        "exp": expira_en
    }
    
    token = jwt.encode(datos, LLAVE, algorithm= "HS256")
    return token



def verificar_token(token: str) -> dict:
    
    try:
        data = jwt.decode(token, LLAVE, algorithms=["HS256"])
        return data
    except JWTError:
        raise AccesoProhibidoError("Sesion Expirada, Intente mas tarde...")
        
