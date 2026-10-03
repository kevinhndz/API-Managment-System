import type {
  Aula,
  AulaPayload,
  Carrera,
  CarreraPayload,
  Docente,
  DocentePayload,
  PaginatedResponse,
  PaginationParams,
} from '../types/api'

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

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
  const token = localStorage.getItem('campusflow.session')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null
    throw new ApiError(body?.detail ?? 'No se pudo completar la solicitud.', response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

function createCrudService<T, TPayload>(path: string) {
  return {
    list(params: PaginationParams = {}) {
      const query = new URLSearchParams({
        pagina_actual: String(params.pagina_actual ?? 1),
        limite: String(params.limite ?? 100),
      })
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
