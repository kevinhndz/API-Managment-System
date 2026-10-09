import { ArrowDown, ArrowRight } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { LampContainer } from '../ui/LampContainer'

interface LoginLandingProps {
  children: ReactNode
}

export function LoginLanding({ children }: LoginLandingProps) {
  const [showNavigation, setShowNavigation] = useState(false)

  function goToLogin() {
    document.getElementById('iniciar-sesion')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  useEffect(() => {
    const updateNavigation = () => setShowNavigation(window.scrollY > window.innerHeight * 0.55)
    updateNavigation()
    window.addEventListener('scroll', updateNavigation, { passive: true })
    return () => window.removeEventListener('scroll', updateNavigation)
  }, [])

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#100d18] text-white">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_0%,rgb(139_92_246_/_0.15),transparent_72%)]" />
      <nav
        aria-label="Navegación de acceso"
        aria-hidden={!showNavigation}
        className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#100d18]/85 px-5 py-3 backdrop-blur-xl transition duration-300 sm:px-8 ${showNavigation ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="#inicio" className="font-semibold tracking-tight text-white" tabIndex={showNavigation ? 0 : -1}>
            Campus<span className="text-violet-300">Flow</span>
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="rounded-full px-3 py-2 text-sm text-violet-100 transition hover:bg-white/10" onClick={goToLogin} tabIndex={showNavigation ? 0 : -1} type="button">
              Iniciar sesión
            </button>
            <Link className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400" to="/solicitar-cuenta" tabIndex={showNavigation ? 0 : -1}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      <section id="inicio" className="relative z-10 min-h-[min(760px,100svh)] overflow-visible px-4 pb-16 pt-8 sm:px-8">
        <LampContainer className="absolute inset-x-0 top-8 h-[min(100svh,820px)]" />
        <div className="relative z-20 mx-auto flex min-h-[min(680px,90svh)] max-w-6xl flex-col items-center justify-end pb-12 text-center sm:pb-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-violet-100/85 sm:text-sm">Gestión académica, más clara</p>
          <h1 className="text-6xl font-semibold tracking-[-0.075em] text-white drop-shadow-[0_4px_28px_rgb(16_13_24_/_0.95)] sm:text-8xl lg:text-[7.5rem]">
            Campus Flow
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-violet-50/90 sm:text-base">
            Todo tu campus conectado en un solo lugar.
          </p>
          <button className="mt-9 inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#171124]/65 px-5 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition hover:border-violet-200/50 hover:bg-[#241637]/85" onClick={goToLogin} type="button">
            Iniciar sesión <ArrowDown aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section id="iniciar-sesion" className="relative z-10 scroll-mt-20 px-4 pb-20 pt-12 sm:px-8 sm:pt-16">
        <div className="mx-auto mb-8 max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Tu espacio académico</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Inicia sesión para continuar</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-violet-100/65">Accede a tus aulas, cursos y herramientas de gestión.</p>
        </div>
        {children}
        <div className="mx-auto mt-6 flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-3 text-sm text-violet-100/70">
          <span>¿Aún no tienes cuenta?</span>
          <Link className="inline-flex items-center gap-1 font-semibold text-violet-200 hover:text-white" to="/solicitar-cuenta">
            Crear cuenta <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <span aria-hidden="true" className="mx-1 text-white/25">·</span>
          <Link className="font-medium text-violet-300 hover:text-white hover:underline" to="/recuperar-contrasena">Olvidé mi contraseña</Link>
        </div>
      </section>
    </div>
  )
}
