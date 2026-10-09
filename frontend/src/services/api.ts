import type {
  Aula,
  AulaPayload,
  Carrera,
  CarreraPayload,
  Docente,
  DocentePayload,
  PaginatedResponse,
  PaginationParams,
  Estudiante, EstudiantePayload, Asignatura, AsignaturaPayload, Periodo, PeriodoPayload, Seccion, SeccionPayload, Matricula, MatriculaPayload, Calificacion, CalificacionPayload, DashboardResumen,
} from '../types/api'

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')


export async function iniciarSesion(usuario: string, contrasena: string) {
  return request<{ autenticada: boolean }>('/login/sesion', { method: 'POST', body: JSON.stringify({ usuario, contrasena }) })
}

export interface SesionActual {
  usuario: string
  nombre?: string | null
  correo: string | null
  rol: string
}

export function obtenerSesionActual() {
  return request<SesionActual>('/login/actual')
}

export function actualizarPerfil(datos: { nombre: string; correo: string }) {
  return request<{ nombre: string; correo: string }>('/login/perfil', {
    method: 'PATCH',
    body: JSON.stringify(datos),
  })
}

export function solicitarRecuperacion(correo: string) {
  return request<{ detail: string }>('/login/recuperacion', {
    method: 'POST',
    body: JSON.stringify({ correo }),
  })
}

export function restablecerContrasena(token: string, contrasena: string) {
  return request<{ detail: string }>('/login/recuperacion/confirmar', {
    method: 'POST',
    body: JSON.stringify({ token, contrasena }),
  })
}

export interface SolicitudCuenta {
  id: number
  nombre_completo: string
  correo: string
  usuario: string
  estado: string
  created_at: string
}

export interface NuevoDocenteSolicitud {
  numero_empleado: string
  nombres: string
  apellidos: string
}

export interface RevisionSolicitudCuenta {
  rol: 'Docente' | 'Administrador'
  docente_id?: number
  docente_nuevo?: NuevoDocenteSolicitud
}

export function solicitarCuenta(datos: { nombre_completo: string; correo: string; usuario: string; contrasena: string }) {
  return request<{ detail: string }>('/solicitudes-cuenta/', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function listarSolicitudesCuenta() {
  return request<SolicitudCuenta[]>('/solicitudes-cuenta/')
}

export function revisarSolicitudCuenta(
  id: number,
  decision: 'aprobar' | 'rechazar',
  revision?: RevisionSolicitudCuenta,
) {
  return request<SolicitudCuenta>(`/solicitudes-cuenta/${id}/${decision}`, {
    method: 'POST',
    body: decision === 'aprobar' ? JSON.stringify(revision) : undefined,
  })
}

export async function cerrarSesion() {
  return request<void>('/login/cerrar', { method: 'POST' })
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/login/')) {
      localStorage.removeItem('campusflow.session')
      localStorage.removeItem('campusflow.user')
      await fetch(`${API_URL}/login/cerrar`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => undefined)
      window.location.assign('/login')
    }
    const body = (await response.json().catch(() => null)) as { detail?: string } | null
    throw new ApiError(body?.detail ?? 'No se pudo completar la solicitud.', response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export interface CrudService<T, TPayload> {
  list: (params?: PaginationParams) => Promise<PaginatedResponse<T>>
  get: (id: number) => Promise<T>
  create: (payload: TPayload) => Promise<T>
  update: (id: number, payload: TPayload) => Promise<T>
  patch: (id: number, payload: Partial<TPayload>) => Promise<T>
  remove: (id: number) => Promise<void>
}

function createCrudService<T, TPayload>(path: string): CrudService<T, TPayload> {
  return {
    list(params: PaginationParams = {}) {
      const query = new URLSearchParams({
        pagina_actual: String(params.pagina_actual ?? 1),
        limite: String(params.limite ?? 100),
      })
      if (params.busqueda?.trim()) query.set('busqueda', params.busqueda.trim())
      return request<PaginatedResponse<T>>(`${path}/?${query}`)
    },
    get(id: number) {
      return request<T>(`${path}/${id}`)
    },
    create(payload: TPayload) {
      return request<T>(`${path}/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    update(id: number, payload: TPayload) {
      return request<T>(`${path}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    },
    patch(id: number, payload: Partial<TPayload>) {
      return request<T>(`${path}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    },
    remove(id: number) {
      return request<void>(`${path}/${id}`, { method: 'DELETE' })
    },
  }
}

export const aulasApi = createCrudService<Aula, AulaPayload>('/aulas')
export const docentesApi = createCrudService<Docente, DocentePayload>('/docentes')
export const carrerasApi = createCrudService<Carrera, CarreraPayload>('/carreras')
export const estudiantesApi = createCrudService<Estudiante, EstudiantePayload>('/estudiantes')
export const asignaturasApi = createCrudService<Asignatura, AsignaturaPayload>('/asignaturas')
export const periodosApi = createCrudService<Periodo, PeriodoPayload>('/periodos')
export const seccionesApi = createCrudService<Seccion, SeccionPayload>('/secciones')
export const matriculasApi = createCrudService<Matricula, MatriculaPayload>('/matriculas')
export const calificacionesApi = createCrudService<Calificacion, CalificacionPayload>('/calificaciones')

export const dashboardApi = {
  resumen() {
    return request<DashboardResumen>('/dashboard/resumen')
  },
}

export type ReportModule = 'matriculas' | 'secciones' | 'estudiantes' | 'docentes' | 'calificaciones'
export type ReportFormat = 'xlsx' | 'pdf'

export interface ReportFilters {
  periodo_id?: number
  estudiante_id?: number
  estado?: string
  carrera_id?: number
  desde?: string
  hasta?: string
}

export interface AuditEvent {
  id: number
  usuario: string
  accion: string
  modulo: string
  registro_id: number | null
  descripcion: string
  fecha: string
}

function queryString<T extends object>(filters: T) {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  return query.toString()
}

export async function descargarReporte(modulo: ReportModule, formato: ReportFormat, filtros: ReportFilters) {
  const response = await fetch(`${API_URL}/reportes/${modulo}/descargar/${formato}?${queryString(filtros)}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('campusflow.session')
      localStorage.removeItem('campusflow.user')
      await fetch(`${API_URL}/login/cerrar`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => undefined)
      window.location.assign('/login')
    }
    const error = (await response.json().catch(() => null)) as { detail?: string } | null
    throw new ApiError(error?.detail ?? 'No se pudo generar el reporte.', response.status)
  }

  const url = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `reporte_${modulo}.${formato}`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function listarActividad(filtros: { modulo?: string; accion?: string; usuario?: string; desde?: string; hasta?: string } = {}) {
  return request<AuditEvent[]>(`/auditoria/?${queryString(filtros)}`)
}
