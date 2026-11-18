import ast
from pathlib import Path


MODULOS = Path(__file__).resolve().parents[1] / "modulos"
OPERACIONES_PERSISTENCIA = {
    "query", "execute", "scalar", "scalars", "add", "add_all", "commit",
    "rollback", "refresh", "delete", "flush", "connection",
}


def test_todos_los_modulos_exponen_sus_capas():
    for router in MODULOS.glob("*/router.py"):
        for capa in ("service.py", "repository.py", "schema.py"):
            assert (router.parent / capa).is_file(), f"Falta {capa} en {router.parent.name}"


def test_routers_y_servicios_delegan_la_persistencia():
    archivos = list(MODULOS.glob("*/router.py"))
    archivos += list(MODULOS.glob("*/*service.py"))
    archivos += [MODULOS / "login" / "recuperacion.py"]
    for archivo in archivos:
        codigo = ast.parse(archivo.read_text(encoding="utf-8-sig"))
        for nodo in ast.walk(codigo):
            if not isinstance(nodo, ast.Call) or not isinstance(nodo.func, ast.Attribute):
                continue
            llamada = nodo.func
            if isinstance(llamada.value, ast.Name) and llamada.value.id == "db":
                assert llamada.attr not in OPERACIONES_PERSISTENCIA, (
                    f"{archivo.relative_to(MODULOS)}:{nodo.lineno} accede a la persistencia"
                )


def test_routers_no_importan_tablas_repositorios_ni_guardan_archivos():
    for archivo in MODULOS.glob("*/router.py"):
        codigo = ast.parse(archivo.read_text(encoding="utf-8-sig"))
        for nodo in ast.walk(codigo):
            if isinstance(nodo, ast.ImportFrom):
                modulo = nodo.module or ""
                assert not modulo.endswith((".repository", ".tabla", "_repository")), archivo
            if isinstance(nodo, ast.Call) and isinstance(nodo.func, ast.Attribute):
                assert nodo.func.attr not in {"write_bytes", "write_text", "unlink", "mkdir"}, archivo


def test_servicios_y_repositorios_no_dependen_de_http():
    archivos = list(MODULOS.glob("*/*service.py")) + list(MODULOS.glob("*/*repository.py"))
    archivos += [MODULOS / "login" / "recuperacion.py"]
    for archivo in archivos:
        codigo = ast.parse(archivo.read_text(encoding="utf-8-sig"))
        for nodo in ast.walk(codigo):
            if isinstance(nodo, ast.ImportFrom):
                assert not (nodo.module or "").startswith(("fastapi", "starlette")), archivo
