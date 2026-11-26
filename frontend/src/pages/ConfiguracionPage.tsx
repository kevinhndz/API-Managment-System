import { ArrowRight, Camera, Check, CircleAlert, Clock3, KeyRound, LoaderCircle, RefreshCw, UserRound } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import { resolverFotoUrl, solicitarRecuperacion, listarSolicitudesCuenta, type SolicitudCuenta } from '../services/api'
import './ConfiguracionPage.css'

export function ConfiguracionPage() {
  const { user, updateProfile, updateProfilePhoto } = useAuth()
  const administrador = ['admin', 'administrador'].includes(user?.role.toLocaleLowerCase('es') ?? '')
  const [nombre, setNombre] = useState(user?.name ?? '')
  const [correo, setCorreo] = useState(user?.email ?? '')
  const [guardando, setGuardando] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [enviandoEnlace, setEnviandoEnlace] = useState(false)
  const [mensajeEnlace, setMensajeEnlace] = useState('')
  const [errorEnlace, setErrorEnlace] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [solicitudes, setSolicitudes] = useState<SolicitudCuenta[]>([])
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false)
  const [errorSolicitudes, setErrorSolicitudes] = useState('')
  const [seccionActiva, setSeccionActiva] = useState('perfil')
  const fotoInput = useRef<HTMLInputElement>(null)

  function irASeccion(id: string) {
    setSeccionActiva(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const cargarSolicitudes = useCallback(async () => {
    if (!administrador) return
    setCargandoSolicitudes(true)
    setErrorSolicitudes('')
    try {
      setSolicitudes(await listarSolicitudesCuenta())
    } catch (cause) {
      setErrorSolicitudes(cause instanceof Error ? cause.message : 'No se pudieron cargar las solicitudes.')
    } finally {
      setCargandoSolicitudes(false)
    }
  }, [administrador])

  useEffect(() => { void cargarSolicitudes() }, [cargarSolicitudes])

  async function guardarPerfil(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGuardando(true)
    setMensaje('')
    setError('')
    try {
      await updateProfile(nombre.trim(), correo.trim())
      setMensaje('Tu información se guardó correctamente.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar tu información.')
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarFoto(event: ChangeEvent<HTMLInputElement>) {
    const foto = event.target.files?.[0]
    if (!foto) return
    setMensaje('')
    setError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(foto.type) || foto.size > 5 * 1024 * 1024) {
      setError('Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.')
      event.target.value = ''
      return
    }
    setSubiendoFoto(true)
    try {
      await updateProfilePhoto(foto)
      setMensaje('La foto de perfil se actualizó correctamente.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la foto.')
    } finally {
      setSubiendoFoto(false)
      event.target.value = ''
    }
  }

  async function enviarEnlace() {
    setMensajeEnlace('')
    setErrorEnlace('')
    const correoGuardado = user?.email.trim() ?? ''
    if (!correoGuardado) {
      setErrorEnlace('Agrega y guarda un correo en tu perfil antes de solicitar el enlace.')
      return
    }
    if (correo.trim().toLowerCase() !== correoGuardado.toLowerCase()) {
      setErrorEnlace('Guarda los cambios del correo antes de solicitar el enlace.')
      return
    }
    setEnviandoEnlace(true)
    try {
      const resultado = await solicitarRecuperacion(correoGuardado)
      setMensajeEnlace(resultado.detail)
    } catch (cause) {
      setErrorEnlace(cause instanceof Error ? cause.message : 'No se pudo enviar el enlace de recuperación.')
    } finally {
      setEnviandoEnlace(false)
    }
  }

  const solicitudesRecientes = [...solicitudes]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 5)
  const pendientes = solicitudes.filter((solicitud) => solicitud.estado.toLocaleUpperCase('es') === 'PENDIENTE').length
  const iniciales = nombre.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'CF'

  return <main className="system-settings">
    <header className="system-settings__header">
      <p className="system-settings__breadcrumb"><Link to="/">Dashboard</Link><span>/</span>Configuración</p>
      <h1>Configuración del sistema</h1>
      <p className="system-settings__intro">Administra tu perfil institucional, seguridad de acceso y solicitudes de cuentas.</p>
    </header>

    <div className="system-settings__layout">
      <nav className="system-settings__nav" aria-label="Secciones de configuración">
        <div className="system-settings__nav-group">
          <span className="system-settings__nav-heading">Cuenta y seguridad</span>
          <button className={seccionActiva === 'perfil' ? 'is-current' : ''} type="button" aria-current={seccionActiva === 'perfil' ? 'location' : undefined} onClick={() => irASeccion('perfil')}>Perfil personal</button>
          <button className={seccionActiva === 'seguridad' ? 'is-current' : ''} type="button" aria-current={seccionActiva === 'seguridad' ? 'location' : undefined} onClick={() => irASeccion('seguridad')}>Contraseña y acceso</button>
        </div>
        {administrador && <div className="system-settings__nav-group">
          <span className="system-settings__nav-heading">Administración</span>
          <button className={seccionActiva === 'solicitudes' ? 'is-current' : ''} type="button" aria-current={seccionActiva === 'solicitudes' ? 'location' : undefined} onClick={() => irASeccion('solicitudes')}>Solicitudes de acceso{pendientes > 0 && <span className="system-settings__count">{pendientes}</span>}</button>
          <Link to="/configuracion/solicitudes">Roles institucionales <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>}
      </nav>

      <div className="system-settings__sections">
        <section id="perfil" className="system-settings__card system-settings__profile">
          <div className="system-settings__section-description">
            <h2>Información personal</h2>
            <p>Solo puedes cambiar tu nombre y correo electrónico de la cuenta activa.</p>
          </div>
          <div className="system-settings__section-content">
            <div className="system-settings__identity">
              <div className="system-settings__identity-person">
                <span className="system-settings__avatar" aria-label="Foto de perfil actual">
                  {iniciales}
                  {user?.photo && <img src={resolverFotoUrl(user.photo) ?? undefined} alt="" />}
                </span>
                <span><strong>{user?.name ?? 'Usuario'}</strong><small>{administrador ? 'Administrador del campus' : user?.role}</small></span>
              </div>
              <input ref={fotoInput} className="system-settings__file-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Seleccionar foto de perfil" onChange={cambiarFoto} />
              <button className="system-settings__button" type="button" onClick={() => fotoInput.current?.click()} disabled={subiendoFoto}>
                {subiendoFoto ? <LoaderCircle size={15} className="system-settings__spin" /> : <Camera size={15} />} {subiendoFoto ? 'Subiendo…' : 'Cambiar foto'}
              </button>
            </div>
            <form className="system-settings__form" onSubmit={guardarPerfil}>
              <label>Nombre<input name="nombre" autoComplete="name" minLength={3} maxLength={160} required value={nombre} onChange={(event) => setNombre(event.target.value)} /></label>
              <label>Correo electrónico<input name="correo" type="email" autoComplete="email" maxLength={150} required value={correo} onChange={(event) => setCorreo(event.target.value)} /></label>
              <button className="system-settings__button system-settings__button--primary" type="submit" disabled={guardando}>
                {guardando ? <LoaderCircle size={15} className="system-settings__spin" /> : <Check size={15} />} {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </section>

        <section id="seguridad" className="system-settings__card system-settings__security">
          <div className="system-settings__section-description">
            <h2>Recuperación de contraseña</h2>
            <p>Solicita un enlace seguro para crear una contraseña nueva.</p>
          </div>
          <div className="system-settings__recovery">
            <KeyRound size={18} aria-hidden="true" />
            <span><strong>Enlace de restablecimiento</strong><small>Se enviará al correo vinculado a la cuenta</small></span>
            <button className="system-settings__button" type="button" onClick={() => void enviarEnlace()} disabled={enviandoEnlace}>
              {enviandoEnlace ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </div>
          {(mensajeEnlace || errorEnlace) && <p className={`system-settings__message${errorEnlace ? ' system-settings__message--error' : ''}`} role={errorEnlace ? 'alert' : 'status'}>{errorEnlace || mensajeEnlace}</p>}
        </section>

        {administrador && <section id="solicitudes" className="system-settings__card system-settings__requests">
          <div className="system-settings__requests-header">
            <div><h2>Solicitudes de acceso</h2><p>Elige el rol institucional al aprobar. La persona solicitante no puede asignárselo.</p></div>
            <button className="system-settings__button system-settings__button--primary" type="button" onClick={() => void cargarSolicitudes()} disabled={cargandoSolicitudes}>
              {cargandoSolicitudes ? <LoaderCircle size={15} className="system-settings__spin" /> : <RefreshCw size={15} />} Actualizar
            </button>
          </div>
          {errorSolicitudes && <p className="system-settings__message system-settings__message--error" role="alert"><CircleAlert size={16} />{errorSolicitudes}</p>}
          {cargandoSolicitudes ? <div className="system-settings__loading" role="status">Cargando solicitudes…</div> : <div className="system-settings__table-wrap">
            <table>
              <thead><tr><th scope="col">Solicitante</th><th scope="col">Usuario</th><th scope="col">Enviada</th><th scope="col">Estado</th></tr></thead>
              <tbody>{solicitudesRecientes.map((solicitud) => <tr key={solicitud.id}>
                <td><span className="system-settings__request-name"><span className="system-settings__request-avatar"><UserRound size={15} /></span>{solicitud.nombre_completo}</span></td>
                <td>{solicitud.usuario}</td>
                <td>{new Date(solicitud.created_at).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td><span className={`system-settings__status system-settings__status--${solicitud.estado.toLocaleLowerCase('es')}`}>
                  {solicitud.estado.toLocaleUpperCase('es') === 'PENDIENTE' ? <Clock3 size={13} /> : <Check size={13} />}{solicitud.estado}
                </span></td>
              </tr>)}
              {!solicitudesRecientes.length && <tr><td colSpan={4} className="system-settings__empty">No hay solicitudes de acceso.</td></tr>}</tbody>
            </table>
          </div>}
          <footer className="system-settings__requests-footer">
            <span>{pendientes} solicitudes pendientes</span>
            <Link to="/configuracion/solicitudes">Administrar solicitudes <ArrowRight size={14} /></Link>
          </footer>
        </section>}

        {(mensaje || error) && <p className={`system-settings__message${error ? ' system-settings__message--error' : ''}`} role={error ? 'alert' : 'status'}>{error || mensaje}</p>}
      </div>
    </div>
  </main>
}
