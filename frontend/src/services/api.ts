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
const HOSTNAME = typeof window === 'undefined' ? 'localhost' : window.location.hostname
export const INSTITUTION_SLUG = import.meta.env.VITE_INSTITUTION_SLUG
  ?? (HOSTNAME === 'localhost' || HOSTNAME === '127.0.0.1' ? 'uphn' : HOSTNAME.split('.')[0])

export interface SuscripcionInstitucional {
  institucion_id: number
  plan_name: string | null
  status: string
  active: boolean
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  has_paddle_subscription: boolean
  checkout_pending: boolean
  can_manage: boolean
}

export function obtenerSuscripcionInstitucional() {
  return request<SuscripcionInstitucional>('/payments/subscription')
}

export function iniciarCheckoutInstitucional() {
  return request<{ transaction_id: string; client_token: string; environment: 'sandbox' | 'production' }>('/payments/checkout', { method: 'POST' })
}

export function abrirPortalInstitucional() {
  return request<{ url: string }>('/payments/portal', { method: 'POST' })
}

function headersInstitucion(): Record<string, string> {
  return { 'X-Institution-Slug': INSTITUTION_SLUG }
}

async function obtenerTokenCsrf() {
  const respuesta = await fetch(`${API_URL}/login/csrf`, {
    credentials: 'include',
    headers: headersInstitucion(),
  })
  if (!respuesta.ok) throw new ApiError('No se pudo preparar la solicitud segura.', respuesta.status)
  const datos = (await respuesta.json()) as { csrf_token: string }
  return datos.csrf_token
}

export function resolverFotoUrl(foto: string | null | undefined) {
  if (!foto) return null
  return foto.startsWith('/uploads/profiles/') ? `${API_URL}${foto}?institucion=${encodeURIComponent(INSTITUTION_SLUG)}` : foto
}


export async function iniciarSesion(usuario: string, contrasena: string) {
  return request<{ autenticada: boolean }>('/login/sesion', { method: 'POST', body: JSON.stringify({ usuario, contrasena }) })
}

export interface SesionActual {
  usuario: string
  nombre?: string | null
  correo: string | null
  rol: string
  foto?: string | null
}

export function obtenerSesionActual() {
  return request<SesionActual>('/login/actual')
}

export function actualizarPerfil(datos: { nombre: string; correo: string }) {
  return request<{ nombre: string; correo: string | null; foto: string | null }>('/login/perfil', {
    method: 'PATCH',
    body: JSON.stringify(datos),
  })
}

export function actualizarFotoPerfil(foto: File) {
  return request<{ nombre: string; correo: string | null; foto: string | null }>('/login/perfil/foto', {
    method: 'PUT',
    headers: { 'Content-Type': foto.type },
    body: foto,
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

export function solicitarCodigoVerificacionCuenta(correo: string) {
  return request<{ verificacion_id: string; expires_in_seconds: number; resend_after_seconds: number; detail: string }>(
    '/solicitudes-cuenta/verificacion',
    { method: 'POST', body: JSON.stringify({ correo }) },
  )
}

export function confirmarCodigoVerificacionCuenta(verificacion_id: string, codigo: string) {
  return request<{ ticket_verificacion: string; detail: string }>(
    '/solicitudes-cuenta/verificacion/confirmar',
    { method: 'POST', body: JSON.stringify({ verificacion_id, codigo }) },
  )
}

export function solicitarCuenta(datos: { nombre_completo: string; correo: string; usuario: string; contrasena: string; ticket_verificacion: string }) {
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
  const metodo = (options.method ?? 'GET').toUpperCase()
  const cambiaDatos = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo)
  const tokenCsrf = cambiaDatos ? await obtenerTokenCsrf() : null
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...headersInstitucion(),
      'Content-Type': 'application/json',
      ...(tokenCsrf ? { 'X-CSRF-Token': tokenCsrf } : {}),
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
        headers: {
          ...headersInstitucion(),
          ...(tokenCsrf ? { 'X-CSRF-Token': tokenCsrf } : {}),
        },
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
export interface CargaDocente {
  docente_id: number
  numero_empleado: string
  nombres: string
  apellidos: string
  tipo_contrato: string | null
  departamento: string | null
  seccion: string
  estado_seccion: string
  dias: string
  hora_inicio: string
  hora_fin: string
  asignatura_id: number
  codigo_asignatura: string
  asignatura: string
  periodo_id: number
  anio: number
  numero: number
  vigente: boolean
}
export function listarCargaDocente() { return request<CargaDocente[]>('/docentes/carga') }
export function obtenerCargaDocente(id: number, periodoId?: number) {
  const params = new URLSearchParams()
  if (periodoId) params.set('periodo_id', String(periodoId))
  return request<CargaDocente[]>(`/docentes/${id}/carga?${params}`)
}
export const carrerasApi = createCrudService<Carrera, CarreraPayload>('/carreras')
export const estudiantesApi = createCrudService<Estudiante, EstudiantePayload>('/estudiantes')
export const asignaturasApi = createCrudService<Asignatura, AsignaturaPayload>('/asignaturas')
export interface EstudianteAsignatura {
  codigo_asignatura: string
  asignatura: string
  cuenta: string
  estudiante: string
  seccion: string
  anio: number
  periodo: number
  estado: string
  fecha_matricula: string
}
export function listarEstudiantesAsignatura(id: number, periodoId?: number) {
  const params = new URLSearchParams()
  if (periodoId) params.set('periodo_id', String(periodoId))
  return request<EstudianteAsignatura[]>(`/asignaturas/${id}/estudiantes?${params}`)
}
export const periodosApi = createCrudService<Periodo, PeriodoPayload>('/periodos')
export const seccionesApi = createCrudService<Seccion, SeccionPayload>('/secciones')
export const matriculasApi = createCrudService<Matricula, MatriculaPayload>('/matriculas')
export const calificacionesApi = createCrudService<Calificacion, CalificacionPayload>('/calificaciones')

export const dashboardApi = {
  resumen() {
    return request<DashboardResumen>('/dashboard/resumen')
  },
}

export type ReportModule = 'matriculas' | 'secciones' | 'estudiantes' | 'docentes' | 'calificaciones' | 'matricula_carrera' | 'ocupacion_secciones' | 'rendimiento_asignaturas' | 'carga_docente' | 'detalle_carga_docente' | 'estudiantes_asignatura' | 'cobros_estudiantiles' | 'nomina_docente' | 'asignaturas_sin_oferta' | 'poblacion_carrera' | 'matricula_estado'
export type ReportFormat = 'xlsx' | 'pdf' | 'csv' | 'json'

export interface ReportFilters {
  periodo_id?: number
  estudiante_id?: number
  docente_id?: number
  asignatura_id?: number
  mes?: string
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
  ip_origen?: string | null
  datos_anteriores?: Record<string, unknown> | null
  datos_nuevos?: Record<string, unknown> | null
  fecha: string
}

export interface NotificacionDocente extends AuditEvent {
  leida: boolean
}

export function listarNotificacionesDocentes() {
  return request<NotificacionDocente[]>('/notificaciones/docentes')
}

export function marcarNotificacionDocenteLeida(id: number) {
  return request<void>(`/notificaciones/docentes/${id}/leida`, { method: 'POST' })
}

function queryString<T extends object>(filters: T) {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  return query.toString()
}

async function obtenerVistaArchivo(path: string): Promise<Blob> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: headersInstitucion(),
  })
  if (!response.ok) {
    if (response.status === 401) window.location.assign('/login')
    const error = (await response.json().catch(() => null)) as { detail?: string } | null
    throw new ApiError(error?.detail ?? 'No se pudo preparar la vista previa.', response.status)
  }
  return response.blob()
}

export function previsualizarReporte(modulo: ReportModule, formato: ReportFormat, filtros: ReportFilters) {
  return obtenerVistaArchivo(`/reportes/${modulo}/previsualizar/${formato}?${queryString(filtros)}`)
}

export function previsualizarDocumento(tipo: 'historial-academico' | 'constancia-estudiantil' | 'constancia-laboral', id: number) {
  return obtenerVistaArchivo(`/documentos/${tipo}/${id}/vista-previa`)
}

export function previsualizarHistorial(estudianteId: number) {
  return previsualizarDocumento('historial-academico', estudianteId)
}

export function urlLogoInstitucional(revision = 0) {
  return `${API_URL}/documentos/logo?institucion=${encodeURIComponent(INSTITUTION_SLUG)}&v=${revision}`
}

export async function subirLogoInstitucional(archivo: File): Promise<void> {
  const tokenCsrf = await obtenerTokenCsrf()
  const response = await fetch(`${API_URL}/documentos/logo`, {
    method: 'PUT',
    credentials: 'include',
    headers: { ...headersInstitucion(), 'X-CSRF-Token': tokenCsrf, 'Content-Type': archivo.type },
    body: archivo,
  })
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { detail?: string } | null
    throw new ApiError(error?.detail ?? 'No se pudo guardar el logo.', response.status)
  }
}

export async function descargarReporte(modulo: ReportModule, formato: ReportFormat, filtros: ReportFilters) {
  const response = await fetch(`${API_URL}/reportes/${modulo}/descargar/${formato}?${queryString(filtros)}`, {
    credentials: 'include',
    headers: headersInstitucion(),
  })

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('campusflow.session')
      localStorage.removeItem('campusflow.user')
      await fetch(`${API_URL}/login/cerrar`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...headersInstitucion(),
          'X-CSRF-Token': await obtenerTokenCsrf().catch(() => ''),
        },
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

export async function descargarDocumento(tipo: 'historial-academico' | 'constancia-laboral' | 'constancia-estudiantil', id: number) {
  const tokenCsrf = await obtenerTokenCsrf()
  const response = await fetch(`${API_URL}/documentos/${tipo}/${id}`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...headersInstitucion(), 'X-CSRF-Token': tokenCsrf },
  })
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { detail?: string } | null
    throw new ApiError(error?.detail ?? 'No se pudo emitir el documento.', response.status)
  }
  const url = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${tipo}_${id}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function listarActividad(filtros: { modulo?: string; accion?: string; usuario?: string; desde?: string; hasta?: string } = {}) {
  return request<AuditEvent[]>(`/auditoria/?${queryString(filtros)}`)
}

export interface ObligacionFinanciera {
  id: number
  tipo: 'ESTUDIANTE' | 'DOCENTE'
  sujeto_id: number
  codigo: string
  persona: string
  mes: string
  concepto: string
  monto: string
  pagado: string
  saldo: string
  moneda: string
  vence_en: string
  estado: 'PENDIENTE' | 'VENCIDO' | 'PARCIAL' | 'PAGADO'
}

export interface CrearObligacionFinanciera {
  tipo: 'ESTUDIANTE' | 'DOCENTE'
  estudiante_id?: number
  docente_id?: number
  mes: string
  concepto: string
  monto: number
  moneda: string
  vence_en: string
}

export const finanzasApi = {
  listar(filtros: { tipo?: string; mes?: string; estado?: string } = {}) {
    return request<ObligacionFinanciera[]>(`/finanzas/obligaciones?${queryString(filtros)}`)
  },
  crear(datos: CrearObligacionFinanciera) {
    return request<ObligacionFinanciera>('/finanzas/obligaciones', { method: 'POST', body: JSON.stringify(datos) })
  },
  registrarPago(id: number, datos: { referencia: string; monto: number; fecha: string; metodo: string }) {
    return request<{ id: number }>(`/finanzas/obligaciones/${id}/pagos`, { method: 'POST', body: JSON.stringify(datos) })
  },
}
