import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'

export function ConfiguracionPage() {
  const { user } = useAuth()
  const esAdministrador = ['admin', 'administrador'].includes(user?.role.toLocaleLowerCase('es') ?? '')

  return <section className="mx-auto max-w-5xl">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a716f]">Cuenta y seguridad</p>
    <h2 className="mt-2 text-3xl font-semibold text-[#261b1a] dark:text-white">Settings</h2>
    <p className="mt-2 text-sm text-slate-600 dark:text-stone-300">Gestiona el acceso y las opciones disponibles para tu cuenta.</p>
    <div className="mt-7 grid gap-4 md:grid-cols-2">
      <Link to="/recuperar-contrasena" className="group rounded-3xl border border-[#ead7d7] bg-white/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-stone-700 dark:bg-[#302624]">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f7e4e4] text-[#5b0309] dark:bg-red-950/40 dark:text-rose-200"><KeyRound className="h-5 w-5" /></span>
        <h3 className="mt-5 text-lg font-semibold">Recuperacion de contrasena</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-stone-300">Solicita un enlace seguro para cambiar una contrasena olvidada.</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#6b1118] dark:text-rose-200">Abrir opcion <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
      </Link>
      {esAdministrador && <Link to="/configuracion/solicitudes" className="group rounded-3xl border border-[#ead7d7] bg-white/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-stone-700 dark:bg-[#302624]">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"><ShieldCheck className="h-5 w-5" /></span>
        <h3 className="mt-5 text-lg font-semibold">Bandeja de solicitudes</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-stone-300">Revisa solicitudes de acceso y define el rol al aprobar una cuenta.</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#6b1118] dark:text-rose-200">Revisar solicitudes <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
      </Link>}
    </div>
  </section>
}
