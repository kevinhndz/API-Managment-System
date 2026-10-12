# Tema 2: multihilos y sincronización en CampusFlow

## Qué se implementó

En **Reportes académicos**, el botón **Consultar vista previa** obtiene una muestra del reporte en un Web Worker, un hilo separado del hilo que dibuja la página. Durante la consulta, los filtros siguen disponibles. La vista muestra el total de registros y hasta 20 filas; las descargas existentes continúan siendo independientes.

## Recorrido de una consulta

1. `frontend/src/pages/ReportesPage.tsx` crea el hilo con `new Worker(...)`, asigna un número a la consulta y envía módulo y filtros con `postMessage`.
2. `frontend/src/workers/reportePreview.worker.ts` recibe el mensaje, consulta `GET /reportes/{modulo}/vista-previa` y procesa la respuesta JSON fuera del hilo visual.
3. `modulos/reportes/router.py` valida los filtros y la sesión. `modulos/reportes/service.py` comprueba el rol y pide los datos al repositorio. Un docente solo obtiene calificaciones de sus secciones.
4. La API devuelve el total, los nombres de columnas y un máximo de 20 filas. El worker devuelve esos datos a la página con `postMessage`.
5. La página comprueba que el número de la respuesta sea el de la consulta actual. Solo entonces muestra el resultado o el error.

## Concurrencia y sincronización

El hilo visual atiende clics y cambios de filtros mientras el worker espera la API y procesa el JSON. Cada hilo tiene su propia memoria: intercambian copias de mensajes, por lo que no necesitan un `Lock` para modificar una lista compartida.

Sí existe una condición de carrera: una consulta anterior puede terminar después de una nueva. Se controla de dos maneras:

- El worker usa `AbortController` para cancelar la petición anterior.
- La página compara el identificador de la respuesta con el de la consulta vigente; ignora respuestas atrasadas. Si cambia un filtro, termina el worker y limpia la vista previa.

No se comparte una sesión de base de datos entre hilos. Cada petición HTTP usa la sesión que FastAPI abre y cierra para ella. Tampoco se agregaron bibliotecas: Web Workers, `postMessage` y `AbortController` son capacidades del navegador.

Esta función sirve para practicar hilos y coordinación. Una petición `fetch` normal ya espera sin congelar la interfaz; con solo 20 filas, el worker no promete una mejora medible de velocidad. La ventaja aquí es que el hilo separado y la respuesta vigente se pueden observar y explicar claramente.

## Demostración para la exposición

1. Inicia la API y el frontend. Entra con una cuenta de administrador y abre **Reportes académicos**.
2. Pulsa **Consultar vista previa**. Mientras diga «Consultando en segundo plano», cambia un filtro o selecciona otro módulo para demostrar que la página sigue respondiendo.
3. Consulta de nuevo y muestra el total y las primeras filas. Explica que la tabla viene de la API; el worker no inventa registros.
4. En las herramientas del navegador, usa una conexión lenta temporalmente si la respuesta es demasiado rápida. Haz dos consultas seguidas: la primera se cancela y la segunda es la que se presenta.
5. Muestra `reportePreview.worker.ts` para señalar el hilo y `ReportesPage.tsx` para señalar el número de consulta. Explica que el número evita mostrar una respuesta desactualizada.
6. Muestra la prueba de cancelación y la prueba del límite de 20 filas. Desde la raíz del proyecto se pueden ejecutar:

   ```powershell
   .\venv\Scripts\python.exe -m pytest tests/test_reportes_auditoria.py -q
   cd frontend
   npm test -- --run src/workers/reportePreview.worker.test.ts src/pages/ReportesPage.test.tsx
   ```

## Límite de la función

La vista previa está limitada a 20 filas visibles, pero el repositorio actual lee todos los registros coincidentes para calcular el total. Si los reportes crecen mucho, convendrá paginar y contar en la base de datos. El worker se usa en el navegador, no crea hilos manuales de Python en el servidor.
