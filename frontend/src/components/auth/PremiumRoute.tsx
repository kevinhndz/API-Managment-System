import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'

import { obtenerSuscripcionInstitucional, type SuscripcionInstitucional } from '../../services/api'

export function PremiumRoute() {
  const [estado, setEstado] = useState<SuscripcionInstitucional | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    obtenerSuscripcionInstitucional()
      .then((datos) => { if (vigente) setEstado(datos) })
      .catch(() => { if (vigente) setError('No se pudo verificar la suscripcion de la universidad.') })
    return () => { vigente = false }
  }, [])

  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">{error}</div>
  if (!estado) return <p role="status" className="text-sm text-slate-500">Verificando acceso institucional...</p>
  if (!estado.active) return <div className="max-w-xl rounded-2xl border bg-[#fffdf8] p-7 dark:border-white/10 dark:bg-[#242033]"><h1 className="text-xl font-semibold dark:text-white">Suscripcion institucional no vigente</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Las funciones premium se habilitan cuando Paddle confirma la suscripcion de esta universidad.</p>{estado.can_manage ? <Link to="/planes" className="mt-5 inline-block rounded-lg bg-navy-900 px-4 py-2 font-semibold text-white dark:bg-violet-700">Ver plan y suscripcion</Link> : <p className="mt-4 text-sm text-slate-500">Contacta al administrador de tu universidad.</p>}</div>
  return <Outlet />
}
