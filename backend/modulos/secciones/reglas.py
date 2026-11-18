import re
import unicodedata
from datetime import datetime, time


_DIAS = {
    "LUN": "LUN",
    "LUNES": "LUN",
    "MAR": "MAR",
    "MARTES": "MAR",
    "MIE": "MIE",
    "MIERCOLES": "MIE",
    "JUE": "JUE",
    "JUEVES": "JUE",
    "VIE": "VIE",
    "VIERNES": "VIE",
    "SAB": "SAB",
    "SABADO": "SAB",
    "DOM": "DOM",
    "DOMINGO": "DOM",
}


def normalizar_dias(dias: str) -> frozenset[str]:
    texto = unicodedata.normalize("NFKD", dias)
    texto = "".join(letra for letra in texto if not unicodedata.combining(letra))
    tokens = [token for token in re.split(r"[,;/|\s+-]+", texto.upper()) if token]
    if not tokens:
        raise ValueError("Indica al menos un dia valido para la seccion.")

    dias_normalizados = set()
    for token in tokens:
        dia = _DIAS.get(token)
        if dia is None:
            raise ValueError(f"El dia '{token}' no es valido.")
        dias_normalizados.add(dia)

    return frozenset(dias_normalizados)


def normalizar_hora(hora: str) -> str:
    try:
        valor = datetime.strptime(hora, "%H:%M").time()
    except ValueError as error:
        raise ValueError("La hora debe tener el formato HH:MM de 24 horas.") from error
    return valor.strftime("%H:%M")


def convertir_hora(hora: str) -> time:
    return time.fromisoformat(normalizar_hora(hora))
