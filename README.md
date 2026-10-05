# CampusFlow

CampusFlow es un sistema web para la gestión académica de un campus universitario. Administra aulas, docentes, carreras, estudiantes, asignaturas, períodos, secciones, matrículas y calificaciones mediante un frontend React conectado a una API FastAPI.

Este README resume qué conceptos de Ingeniería de Software 1 y 2 ya están presentes, qué falta implementar y cómo explicar el proyecto en una exposición.

## Tecnologías

- Backend: Python, FastAPI, Pydantic, SQLAlchemy, PostgreSQL/Supabase, Alembic y JWT.
- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Vitest y Testing Library.

## Arquitectura actual

El sistema utiliza una arquitectura cliente-servidor y un monolito modular:

```text
React + TypeScript -> HTTP/JSON -> FastAPI -> Service -> Repository -> SQLAlchemy -> PostgreSQL
```

Los módulos del backend separan normalmente `router`, `service`, `repository`, `schema` y `tabla`. El frontend reutiliza componentes para CRUD, filtros, paginación y acciones.

## Ingeniería de Software 1 aplicada

### Ciclo de vida y proceso

El proyecto se desarrolló de forma incremental: se agregaron módulos, filtros, paginación, dashboard y mejoras visuales en ciclos pequeños. Este proceso se parece a un modelo iterativo e incremental.

Para explicarlo:

> No construí todo el sistema de una sola vez. Fui agregando capacidades por etapas, validando cada cambio y corrigiendo problemas antes de continuar.

Falta documentar formalmente las iteraciones, entregables y criterios de cierre.

### Metodologías ágiles

El trabajo utilizó cambios pequeños, prioridades variables, revisión frecuente y ramas de Git. Eso refleja una forma de trabajo ágil, aunque todavía falta documentar un backlog, historias de usuario, criterios de aceptación, sprints, retrospectivas y un tablero Kanban.

Ejemplo de historia de usuario:

> Como administrador académico, quiero filtrar docentes activos e inactivos para consultar rápidamente el personal disponible.

### Requisitos

Los módulos representan requisitos funcionales del negocio: administrar personas, aulas, carreras, asignaturas, períodos, secciones, matrículas y calificaciones. También existen requisitos no funcionales de usabilidad, seguridad, mantenibilidad y rendimiento mediante filtros, paginación, autenticación, componentes reutilizables y validaciones.

Falta crear un SRS formal con alcance, actores, requisitos numerados, reglas de negocio, requisitos no funcionales medibles y matriz de trazabilidad.

### UML

Las entidades del sistema permiten crear diagramas de casos de uso, clases, secuencia, actividades, componentes y despliegue. Sin embargo, todavía no hay diagramas UML versionados en el repositorio.

Recomendación: crear `docs/uml/` usando Mermaid, PlantUML o draw.io. Priorizar login, crear matrícula, registrar calificación y la arquitectura general.

### Diseño y principios

El proyecto aplica:

- Modularidad al separar el dominio académico por módulos.
- Cohesión al mantener juntas las responsabilidades de cada módulo.
- Separación de responsabilidades entre router, service y repository.
- DRY mediante `EntityPage` y `createCrudService`.
- KISS al usar un monolito modular en vez de microservicios innecesarios.
- Bajo acoplamiento entre frontend, servicios HTTP y backend.

SOLID se aplica parcialmente, especialmente responsabilidad única y separación de interfaces. Falta una revisión formal de funciones demasiado extensas y dependencias directas.

### Patrones

El sistema utiliza estructuras equivalentes a:

- Repository para aislar el acceso a datos.
- Service Layer para las reglas de negocio.
- Factory en `createCrudService` para crear clientes API CRUD.
- Adapter al transformar respuestas HTTP al formato del frontend.
- Facade en `EntityPage`, que concentra la experiencia CRUD reutilizable.

### Arquitectura

La arquitectura actual es una aplicación en capas y un monolito modular. Es una decisión adecuada para el tamaño actual porque simplifica desarrollo, pruebas y despliegue.

Falta documentar la arquitectura con C4, crear ADRs y explicar alternativas descartadas.

## Ingeniería de Software 2 aplicada

### Arquitectura avanzada y DDD

Ya existe una base de monolito modular. Las entidades del dominio incluyen Estudiante, Sección, Matrícula, Asignatura y Calificación.

Todavía no existe una capa de dominio independiente del ORM, agregados formales, objetos de valor ni eventos de dominio. Recomiendo definir primero las reglas de matrícula y cupos antes de aplicar DDD completo.

### Microservicios

No hay microservicios, colas, API Gateway, Saga, circuit breaker ni consistencia eventual. Esto no es un problema actualmente: dividir el sistema ahora aumentaría complejidad sin una necesidad clara. Si se quiere practicar el tema, Reportes podría convertirse más adelante en un proceso asíncrono independiente.

### Calidad y pruebas

Actualmente existen pruebas de contrato del OpenAPI del backend y pruebas del frontend con Vitest y Testing Library.

Falta agregar:

- Pruebas unitarias de services y repositories.
- Pruebas de integración con `TestClient` y base de datos de prueba.
- Pruebas end-to-end con Playwright.
- Cobertura con `pytest-cov`.
- Ruff y Mypy.
- Pruebas de carga con Locust o k6.
- Hypothesis para pruebas basadas en propiedades.

La prioridad debería ser cubrir autenticación, matrículas, reglas de cupo y filtros.

### CI/CD y DevOps

Todavía no hay GitHub Actions. Falta crear un pipeline que ejecute instalación, Ruff, Mypy, Pytest, TypeScript, Vitest y build de Vite. Después se puede agregar Docker, staging, publicación de imagen y despliegue automático.

### Observabilidad

Existe manejo global de excepciones, pero todavía faltan los tres pilares completos: logs estructurados, métricas y trazas.

Recomendación:

1. Agregar logs JSON con método, ruta, código HTTP, duración y usuario, sin secretos.
2. Exponer métricas Prometheus.
3. Añadir Grafana con peticiones, latencia y errores.
4. Definir SLI y SLO.

### Seguridad

Ya existen JWT, expiración de tokens, roles y hash de contraseñas. Falta revisar OWASP Top 10, autorización por endpoint, esquema `Bearer`, CORS, rate limiting, secretos, `pip-audit`, Dependabot y pruebas de permisos.

### Gestión y mantenimiento

El historial de Git y la rama `refactor` muestran control de versiones. También existe Alembic para migraciones y el trabajo reciente demuestra mantenimiento correctivo y perfectivo.

Falta agregar `CHANGELOG.md`, `CONTRIBUTING.md`, `LICENSE`, `.env.example`, versionado semántico, guía de onboarding, pruebas de caracterización y política de compatibilidad de API.

## Recomendación de implementación

El orden más conveniente es:

1. Historias de usuario y SRS.
2. Diagramas UML, C4 y ADRs.
3. Pruebas de integración para autenticación y matrículas.
4. Cobertura, Ruff y Mypy.
5. GitHub Actions para validar cada push.
6. Logs estructurados y métricas.
7. Revisión OWASP y escaneo de dependencias.
8. DDD o procesamiento asíncrono solo cuando las reglas lo justifiquen.

No recomendaría iniciar por microservicios. Primero fortalecería pruebas, seguridad, documentación y operación del monolito modular.

## Guion para la exposición

### Problema

> CampusFlow centraliza la gestión académica de un campus. Permite administrar aulas, docentes, carreras, estudiantes, asignaturas, períodos, secciones, matrículas y calificaciones desde una sola aplicación.

### Arquitectura

> El frontend está construido con React y TypeScript. El backend usa FastAPI y expone una API REST. Separé los routers, servicios y repositorios para que cada capa tenga una responsabilidad clara. La base de datos se maneja con SQLAlchemy y las migraciones con Alembic.

### Proceso

> Utilicé un proceso incremental. Fui agregando módulos y después incorporé filtros, paginación, acciones CRUD, dashboard y mejoras visuales. Cada cambio se guardó en Git y se validó con compilación o pruebas.

### Principios de IS 1

> Apliqué modularidad al separar los módulos académicos, separación de responsabilidades entre capas, DRY mediante componentes reutilizables, KISS al mantener un monolito modular y Repository y Service Layer para organizar el backend.

### Pruebas y seguridad

> Existen pruebas de contrato del backend y pruebas del frontend. También implementé autenticación JWT, expiración de sesiones, roles y hash de contraseñas. Como trabajo pendiente debo ampliar la cobertura con pruebas de integración y revisar la API con OWASP Top 10.

### Principios de IS 2

> De Ingeniería de Software 2 ya adapté la idea de monolito modular, la separación de dominios académicos, migraciones y prácticas iniciales de mantenibilidad. Todavía debo implementar CI/CD, observabilidad, diagramas C4, ADRs, pruebas de carga y una revisión de seguridad automatizada.

### Cierre

> La decisión principal fue mantener una arquitectura sencilla y modular. Esto permite entender y mantener el sistema ahora, y deja una base para evolucionarlo si aumentan los usuarios o las necesidades operativas.

## Conclusión

CampusFlow demuestra varios fundamentos de Ingeniería de Software 1 y una base inicial de Ingeniería de Software 2. Para presentarlo con rigor, conviene explicar tanto lo implementado como lo pendiente. Eso demuestra criterio técnico y evita afirmar que una práctica está completa cuando todavía es una recomendación.
