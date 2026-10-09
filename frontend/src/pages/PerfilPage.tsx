import { ArrowLeft, KeyRound, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'

export function PerfilPage() {
  const { user, updateProfile } = useAuth()
  const [nombre, setNombre] = useState(user?.name ?? '')
  const [correo, setCorreo] = useState(user?.email ?? '')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGuardando(true)
    setMensaje('')
    setError('')
    try {
      await updateProfile(nombre.trim(), correo.trim())
      setMensaje('Tu perfil se actualizó correctamente.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el perfil.')
    } finally {
      setGuardando(false)
    }
  }

  return <section className="mx-auto max-w-3xl">
    <div className="mb-6 flex flex-wrap gap-x-5 gap-y-2">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b1118] hover:underline dark:text-violet-200"><ArrowLeft className="h-4 w-4" /> Volver al dashboard</Link>
      <Link to="/configuracion" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b1118] hover:underline dark:text-violet-200"><ArrowLeft className="h-4 w-4" /> Volver a Settings</Link>
    </div>
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a716f]">Cuenta y seguridad</p>
    <h2 className="mt-2 text-3xl font-semibold text-[#261b1a] dark:text-white">Editar perfil</h2>
    <p className="mt-2 text-sm text-slate-600 dark:text-stone-300">Edita los datos de la cuenta con la que iniciaste sesión.</p>

    <form onSubmit={guardar} className="mt-7 rounded-3xl border border-[#ead7d7] bg-white/85 p-6 shadow-sm dark:border-[#39334b] dark:bg-[#242033] sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f7e4e4] text-[#5b0309] dark:bg-[#5e35b1]/20 dark:text-violet-200"><UserRound className="h-5 w-5" /></span>
        <div><h3 className="font-semibold">Información personal</h3><p className="text-sm text-slate-600 dark:text-stone-300">Solo puedes cambiar tu nombre y correo.</p></div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">Nombre
          <input className="mt-1.5 h-11 w-full rounded-xl border border-[#e3d5d5] bg-transparent px-3 dark:border-[#514a61]" name="nombre" autoComplete="name" minLength={3} maxLength={160} required value={nombre} onChange={(event) => setNombre(event.target.value)} />
        </label>
        <label className="block text-sm font-medium">Correo electrónico
          <input className="mt-1.5 h-11 w-full rounded-xl border border-[#e3d5d5] bg-transparent px-3 dark:border-[#514a61]" name="correo" type="email" autoComplete="email" maxLength={150} required value={correo} onChange={(event) => setCorreo(event.target.value)} />
        </label>
      </div>
      {mensaje && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200" role="status">{mensaje}</p>}
      {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200" role="alert">{error}</p>}
      <button className="pressable mt-6 h-11 rounded-xl bg-[#5b0309] px-5 text-sm font-semibold text-white transition hover:bg-[#76131a] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#5e35b1] dark:hover:bg-[#7048c6]" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
    </form>

    <Link to="/configuracion/recuperacion" className="group mt-5 flex items-center gap-4 rounded-3xl border border-[#ead7d7] bg-white/85 p-5 shadow-sm transition hover:shadow-md dark:border-[#39334b] dark:bg-[#242033]">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f7e4e4] text-[#5b0309] dark:bg-[#5e35b1]/20 dark:text-violet-200"><KeyRound className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block font-semibold">Recuperación de contraseña</span><span className="mt-1 block text-sm text-slate-600 dark:text-stone-300">Solicita un enlace para crear una contraseña nueva.</span></span>
      <ArrowLeft className="h-4 w-4 rotate-180 transition group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  </section>
}
