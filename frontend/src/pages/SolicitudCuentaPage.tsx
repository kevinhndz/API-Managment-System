import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck, UserPlus } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'

import { PasswordInput } from '../components/ui/PasswordInput'
import {
  confirmarCodigoVerificacionCuenta,
  solicitarCodigoVerificacionCuenta,
  solicitarCuenta,
} from '../services/api'
import './SolicitudCuentaPage.css'

type Paso = 'datos' | 'codigo' | 'verificado' | 'enviado'

interface DatosSolicitud {
  nombre_completo: string
  correo: string
  usuario: string
  contrasena: string
}

const datosIniciales: DatosSolicitud = {
  nombre_completo: '',
  correo: '',
  usuario: '',
  contrasena: '',
}

function ocultarCorreo(correo: string) {
  const [usuario, dominio] = correo.split('@')
  if (!usuario || !dominio) return correo
  const visible = usuario.length < 3 ? usuario[0] : usuario.slice(0, 2)
  return `${visible}${'•'.repeat(Math.min(5, Math.max(2, usuario.length - visible.length)))}@${dominio}`
}

export function SolicitudCuentaPage() {
  const [paso, setPaso] = useState<Paso>('datos')
  const [datos, setDatos] = useState(datosIniciales)
  const [codigo, setCodigo] = useState('')
  const [verificacionId, setVerificacionId] = useState('')
  const [ticket, setTicket] = useState('')
  const [segundosRestantes, setSegundosRestantes] = useState(0)
  const [segundosParaReenvio, setSegundosParaReenvio] = useState(0)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const entradaCodigo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (paso !== 'codigo' || (segundosRestantes <= 0 && segundosParaReenvio <= 0)) return
    const temporizador = window.setInterval(() => {
      setSegundosRestantes((actual) => Math.max(0, actual - 1))
      setSegundosParaReenvio((actual) => Math.max(0, actual - 1))
    }, 1000)
    return () => window.clearInterval(temporizador)
  }, [paso, segundosRestantes > 0, segundosParaReenvio > 0])

  useEffect(() => {
    if (paso === 'codigo') entradaCodigo.current?.focus()
  }, [paso])

  function actualizarDato(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget
    setDatos((actuales) => ({ ...actuales, [name]: value }))
  }

  async function enviarCodigo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMensaje('')
    setEnviando(true)
    try {
      const resultado = await solicitarCodigoVerificacionCuenta(datos.correo)
      setVerificacionId(resultado.verificacion_id)
      setSegundosRestantes(resultado.expires_in_seconds)
      setSegundosParaReenvio(resultado.resend_after_seconds)
      setCodigo('')
      setPaso('codigo')
      setMensaje('Te enviamos un código de verificación. Revisa tu bandeja de entrada.')
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo enviar el código.')
    } finally {
      setEnviando(false)
    }
  }

  async function confirmarCodigo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const resultado = await confirmarCodigoVerificacionCuenta(verificacionId, codigo)
      setTicket(resultado.ticket_verificacion)
      setPaso('verificado')
      setMensaje('Correo verificado. Ya puedes enviar tu solicitud de cuenta.')
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo verificar el código.')
    } finally {
      setEnviando(false)
    }
  }

  async function reenviarCodigo() {
    setError('')
    setEnviando(true)
    try {
      const resultado = await solicitarCodigoVerificacionCuenta(datos.correo)
      setVerificacionId(resultado.verificacion_id)
      setSegundosRestantes(resultado.expires_in_seconds)
      setSegundosParaReenvio(resultado.resend_after_seconds)
      setCodigo('')
      setMensaje('Enviamos un nuevo código. El anterior ya no funciona.')
      entradaCodigo.current?.focus()
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo reenviar el código.')
    } finally {
      setEnviando(false)
    }
  }

  async function enviarSolicitud() {
    setError('')
    setEnviando(true)
    try {
      const resultado = await solicitarCuenta({ ...datos, ticket_verificacion: ticket })
      setMensaje(resultado.detail)
      setPaso('enviado')
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo enviar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  function editarCorreo() {
    setPaso('datos')
    setCodigo('')
    setVerificacionId('')
    setTicket('')
    setMensaje('')
    setError('')
  }

  function cambiarCodigo(event: ChangeEvent<HTMLInputElement>) {
    setCodigo(event.currentTarget.value.replace(/\D/g, '').slice(0, 6))
    setError('')
  }

  function navegarCodigo(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') return
    if (event.key === ' ') event.preventDefault()
  }

  const tiempo = `${Math.floor(segundosRestantes / 60)}:${String(segundosRestantes % 60).padStart(2, '0')}`

  return <main className="signup-page">
    <section className="signup-panel" aria-labelledby="signup-title">
      <Link className="signup-back" to="/login"><ArrowLeft aria-hidden="true" /> Volver al acceso</Link>

      {paso === 'enviado' ? <div className="signup-result" role="status">
        <span className="signup-icon signup-icon--success"><CheckCircle2 aria-hidden="true" /></span>
        <p className="signup-eyebrow">Acceso al campus</p>
        <h1 id="signup-title">Solicitud enviada</h1>
        <p>{mensaje}</p>
        <Link className="signup-button signup-button--secondary" to="/login">Volver al inicio de sesión</Link>
      </div> : <>
        <div className="signup-heading signup-step">
          <span className="signup-icon" aria-hidden="true">{paso === 'datos' ? <UserPlus /> : <ShieldCheck />}</span>
          <p className="signup-eyebrow">Acceso al campus</p>
          <h1 id="signup-title">{paso === 'codigo' ? 'Verifica tu correo' : paso === 'verificado' ? 'Correo confirmado' : 'Solicitar una cuenta'}</h1>
          <p className="signup-description">
            {paso === 'datos' && 'Completa tus datos. Te enviaremos un código para confirmar tu correo antes de mandar la solicitud.'}
            {paso === 'codigo' && <>Enviamos un código de 6 dígitos a <strong>{ocultarCorreo(datos.correo)}</strong>. Escríbelo para continuar.</>}
            {paso === 'verificado' && 'El correo ya está confirmado. Envía tu solicitud para que el administrador la revise.'}
          </p>
        </div>

        {paso === 'datos' && <form className="signup-form signup-step" onSubmit={enviarCodigo}>
          <label>Nombre completo<input name="nombre_completo" autoComplete="name" minLength={3} maxLength={160} required value={datos.nombre_completo} onChange={actualizarDato} /></label>
          <label>Correo<input name="correo" type="email" autoComplete="email" maxLength={150} required value={datos.correo} onChange={actualizarDato} /></label>
          <label>Usuario<input name="usuario" autoComplete="username" minLength={3} maxLength={80} required value={datos.usuario} onChange={actualizarDato} /></label>
          <PasswordInput id="solicitud-contrasena" label="Contraseña" name="contrasena" value={datos.contrasena} onChange={(value) => setDatos((actuales) => ({ ...actuales, contrasena: value }))} minLength={12} maxLength={72} />
          <p className="signup-note">Un administrador revisará tu solicitud y definirá el acceso adecuado.</p>
          {error && <p className="signup-error" role="alert">{error}</p>}
          <button className="signup-button" disabled={enviando}>{enviando ? <><LoaderCircle className="signup-spinner" /> Enviando código...</> : <>Enviar código al correo <ArrowRight /></>}</button>
        </form>}

        {paso === 'codigo' && <form className="signup-code-form signup-step" onSubmit={confirmarCodigo}>
          <div className="signup-code-boxes" onClick={() => entradaCodigo.current?.focus()}>
            <input
              ref={entradaCodigo}
              aria-label="Código de verificación de seis dígitos"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={codigo}
              onChange={cambiarCodigo}
              onKeyDown={navegarCodigo}
              disabled={enviando}
            />
            {Array.from({ length: 6 }, (_, index) => <span className="signup-code-slot" data-active={codigo.length === index} key={index} aria-hidden="true">{codigo[index] ?? ''}</span>)}
          </div>
          <p className="signup-code-hint">Puedes pegar aquí el código completo que recibiste.</p>
          {error && <p className="signup-error" role="alert">{error}</p>}
          <button className="signup-button" disabled={enviando || codigo.length !== 6}>
            {enviando ? <><LoaderCircle className="signup-spinner" /> Verificando...</> : 'Verificar código'}
          </button>
          <p className="signup-resend">
            ¿No te llegó?{' '}
            {segundosParaReenvio === 0
              ? <button className="signup-text-button" type="button" onClick={reenviarCodigo} disabled={enviando}>Reenviar código</button>
              : <span>Reenviar en {`${Math.floor(segundosParaReenvio / 60)}:${String(segundosParaReenvio % 60).padStart(2, '0')}`}</span>}
            {segundosRestantes > 0 && <span aria-label="Tiempo restante"> · vence en {tiempo}</span>}
          </p>
          <button className="signup-change-email" type="button" onClick={editarCorreo}><ArrowLeft /> Cambiar correo o datos</button>
        </form>}

        {paso === 'verificado' && <div className="signup-verified signup-step" role="status">
          <div className="signup-verified-email"><CheckCircle2 aria-hidden="true" /><span>{ocultarCorreo(datos.correo)} verificado</span></div>
          {error && <p className="signup-error" role="alert">{error}</p>}
          <button className="signup-button" type="button" onClick={enviarSolicitud} disabled={enviando}>
            {enviando ? <><LoaderCircle className="signup-spinner" /> Enviando solicitud...</> : <>Enviar solicitud <ArrowRight /></>}
          </button>
          <button className="signup-change-email" type="button" onClick={editarCorreo}><ArrowLeft /> Volver a editar datos</button>
        </div>}
      </>}
    </section>
  </main>
}
