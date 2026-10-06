from modulos.chatbot.service import ChatbotService


# Verifica que el lenguaje comun se convierta en una funcion de negocio.
def test_interpreta_sinonimos_de_docentes_inactivos():
    assert ChatbotService.interpretar("dame los profes inactibos") == ("listar_docentes", "inactivo")


# Verifica que una solicitud de Excel seleccione la funcion de reporte.
def test_interpreta_reporte_de_matriculas_canceladas():
    assert ChatbotService.interpretar("genera un excel de matriculas canceladas") == ("generar_excel_matriculas", "cancelada")


# Verifica que una consulta desconocida reciba ayuda en vez de inventar datos.
def test_interpreta_consulta_desconocida_como_ayuda():
    assert ChatbotService.interpretar("haz algo raro") == ("ayuda", "todos")
