import { UserRound } from 'lucide-react'
import { EntityPage } from '../components/crud/EntityPage'
import { useAcademicLabels } from '../hooks/useAcademicLabels'
import { calificacionesApi } from '../services/api'
import type { Calificacion, CalificacionPayload } from '../types/api'
import { useAuth } from '../contexts/AuthContext'
const empty: CalificacionPayload = { matricula_id: 1, primer_parcial: 0, segundo_parcial: 0, tercer_parcial: 0, observacion: '' }
export function CalificacionesPage() {
  const labels = useAcademicLabels()
  const { user } = useAuth()
  const esAdministrador = ['admin', 'administrador'].includes(user?.role.toLocaleLowerCase('es') ?? '')
  return <div className="space-y-4">
    {!esAdministrador && <p className="rounded-xl border border-sage-200 bg-sage-50 p-3 text-sm text-sage-900 dark:border-sage-800 dark:bg-sage-950/30 dark:text-sage-200">
      Aquí aparecen las calificaciones de tus secciones asignadas. Si la lista está vacía, pide al administrador que te asigne secciones y verifica que tengan matrículas y calificaciones registradas.
    </p>}
    <EntityPage<Calificacion, CalificacionPayload> title="Calificaciones" singular="Calificación" newLabel="Nueva calificación" description="Registra y consulta las evaluaciones académicas." service={calificacionesApi} canCreate canEdit canDelete={esAdministrador} emptyPayload={empty} toPayload={(item) => ({ matricula_id: item.matricula_id, primer_parcial: item.primer_parcial, segundo_parcial: item.segundo_parcial, tercer_parcial: item.tercer_parcial, observacion: item.observacion })} searchableText={(item) => `${labels.matriculas[item.matricula_id] ?? ''} ${item.nota_final}`} columns={[{ label: 'Estudiante', render: (item) => <span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-sage-600" /><strong>{labels.matriculas[item.matricula_id] ?? `Matrícula #${item.matricula_id}`}</strong></span> }, { label: 'Primer parcial', render: (item) => item.primer_parcial }, { label: 'Segundo parcial', render: (item) => item.segundo_parcial }, { label: 'Tercer parcial', render: (item) => item.tercer_parcial }, { label: 'Nota final', render: (item) => item.nota_final }]} fields={[{ key: 'matricula_id', label: 'Matrícula', type: 'select', valueType: 'number', options: labels.matriculaOptions }, { key: 'primer_parcial', label: 'Primer parcial', type: 'number', min: 0, max: 100 }, { key: 'segundo_parcial', label: 'Segundo parcial', type: 'number', min: 0, max: 100 }, { key: 'tercer_parcial', label: 'Tercer parcial', type: 'number', min: 0, max: 100 }, { key: 'observacion', label: 'Observación' }]} />
  </div>
}
