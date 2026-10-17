import { ArrowLeft, ImagePlus, KeyRound } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import { resolverFotoUrl } from '../services/api'

export function PerfilPage() {
  const { user, updateProfile, updateProfilePhoto } = useAuth()
  const [nombre, setNombre] = useState(user?.name ?? '')
  const [correo, setCorreo] = useState(user?.email ?? '')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [fotoError, setFotoError] = useState('')
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [fotoInvalida, setFotoInvalida] = useState(false)
  const inputFoto = useRef<HTMLInputElement>(null)

  async function cambiarFoto(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0]
    if (!archivo) return
    setFotoError('')
    setFotoInvalida(false)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type) || archivo.size > 5 * 1024 * 1024) {
      setFotoError('Elige JPG, PNG o WebP de hasta 5 MB.')
      event.target.value = ''
      return
    }
    setSubiendoFoto(true)
    try {
      await updateProfilePhoto(archivo)
    } catch (cause) {
      setFotoError(cause instanceof Error ? cause.message : 'No se pudo subir la foto.')
    } finally {
      setSubiendoFoto(false)
      event.target.value = ''
    }
  }

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
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-[#ead7d7] bg-[#eee3f7] text-lg font-bold text-[#5e35b1] dark:border-[#514a61] dark:bg-[#302a43] dark:text-violet-200" aria-label="Foto de perfil actual">
          {!user?.photo && (user?.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CF')}
          {user?.photo && !fotoInvalida && <img className="absolute inset-0 h-full w-full object-cover" src={resolverFotoUrl(user.photo) ?? undefined} alt="" onError={() => setFotoInvalida(true)} />}
        </span>
        <div className="min-w-0 flex-1"><h3 className="font-semibold">Información personal</h3><p className="text-sm text-slate-600 dark:text-stone-300">Solo puedes cambiar tu nombre y correo.</p></div>
        <input ref={inputFoto} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Seleccionar foto de perfil" onChange={cambiarFoto} />
        <button type="button" className="pressable inline-flex h-10 items-center gap-2 rounded-xl border border-[#e3d5d5] px-3 text-sm font-semibold dark:border-[#514a61]" onClick={() => inputFoto.current?.click()} disabled={subiendoFoto}><ImagePlus className="h-4 w-4" />{subiendoFoto ? 'Subiendo…' : 'Cambiar foto'}</button>
      </div>
      {!user?.photo && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200" role="status">Agrega una foto para completar tu perfil.</p>}
      {fotoError && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200" role="alert">{fotoError}</p>}
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
