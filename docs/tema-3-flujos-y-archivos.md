# Tema 3: flujos y archivos en CampusFlow

## Qué hace el sistema

En **Reportes académicos**, una persona autorizada elige un módulo, aplica filtros y descarga Excel, PDF, CSV o JSON. CSV y JSON son formatos adicionales para guardar y reutilizar los registros consultados.

## Recorrido del archivo

1. `frontend/src/pages/ReportesPage.tsx` envía el módulo, formato y filtros al servicio de descarga.
2. `frontend/src/services/api.ts` hace el `GET` a `/reportes/{modulo}/descargar/{formato}` y recibe el contenido como `Blob`.
3. `modulos/reportes/router.py` valida módulo y formato, exige una sesión, aplica las restricciones del rol y obtiene los registros mediante el repositorio.
4. `modulos/reportes/exportadores.py` escribe las filas CSV o el documento JSON en un flujo temporal en memoria, obtiene sus bytes y cierra el flujo. No guarda archivos académicos en el disco del servidor.
5. FastAPI responde como archivo adjunto con su tipo y nombre (`reporte_estudiantes.csv`, por ejemplo). El navegador inicia la descarga.
6. El navegador guarda el archivo en su carpeta de descargas o pregunta la ubicación, según la configuración del usuario. CampusFlow no fija ni necesita conocer esa ruta local.

## Datos y lectura

- CSV incluye encabezados legibles y usa UTF-8 con marca BOM para abrir correctamente acentos en hojas de cálculo. Las comas, comillas y saltos de línea se escapan con el módulo estándar `csv`.
- CSV neutraliza valores de texto que podrían interpretarse como fórmulas al abrirse en una hoja de cálculo.
- JSON incluye el módulo, el total de filas y una lista de registros con nombres de campo estables. Las fechas se convierten a formato ISO y los valores vacíos se conservan como `null`.
- Los formatos conservan los filtros del reporte. Los docentes solo pueden exportar las calificaciones de sus propias secciones.
- El frontend recibe el archivo, crea una URL temporal de descarga y la revoca después. No se agrega una biblioteca nueva: se usan `csv`, `json`, `StringIO`, `Blob` y las capacidades del navegador.

## Errores y comprobación

FastAPI rechaza formatos o módulos no admitidos y filtros de fecha inválidos. Si la sesión expiró, la interfaz vuelve al acceso; los demás errores se muestran en la pantalla de reportes. Los archivos temporales se manejan en memoria y los flujos de texto se cierran incluso si ocurre un error durante la escritura.

La prueba automatizada genera los archivos, abre el CSV como filas y el JSON como datos, y compara encabezados, acentos, comas, estados, fechas y cantidad de registros con los datos de origen. También prueba la descarga HTTP con las restricciones de acceso de un docente y el nombre del archivo.

## Demostración para la exposición

1. Abre **Reportes académicos**, selecciona Estudiantes y aplica un filtro sencillo.
2. Descarga CSV; ábrelo en una hoja de cálculo y comprueba que encabezados y filas respeten el filtro.
3. Descarga JSON; ábrelo en un editor de texto y muestra `total_registros` y `registros`.
4. Explica que los datos se consultan de la base, se escriben temporalmente en un flujo, se convierten en un archivo descargable y el navegador decide dónde guardarlo.
5. Para mostrar la comprobación automática, ejecuta desde la raíz del proyecto:

   ```powershell
   .\venv\Scripts\python.exe -m pytest tests/test_reportes_auditoria.py -q
   ```
