from main import app


def test_api_registra_los_modulos_academicos():
    rutas = set(app.openapi()['paths'])
    esperadas = {
        '/aulas/', '/docentes/', '/carreras/', '/estudiantes/',
        '/asignaturas/', '/periodos/', '/secciones/', '/matriculas/',
        '/calificaciones/', '/reportes/matriculas', '/reportes/secciones',
    }
    assert esperadas.issubset(rutas)


def test_modulos_crud_exponen_operaciones_principales():
    operaciones = {(ruta, metodo.upper()) for ruta, definicion in app.openapi()['paths'].items() for metodo in definicion}
    for modulo in ('estudiantes', 'asignaturas', 'periodos', 'secciones', 'matriculas', 'calificaciones'):
        assert (f'/{modulo}/', 'GET') in operaciones
        assert (f'/{modulo}/', 'POST') in operaciones
