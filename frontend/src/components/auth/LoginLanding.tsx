import { ArrowDown, ArrowRight, BookOpenCheck } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { LampContainer } from '../ui/LampContainer'

interface LoginLandingProps {
  children: ReactNode
}

export function LoginLanding({ children }: LoginLandingProps) {
  const [showNavigation, setShowNavigation] = useState(false)

  useEffect(() => {
    const updateNavigation = () => setShowNavigation(window.scrollY > window.innerHeight * 0.55)
    updateNavigation()
    window.addEventListener('scroll', updateNavigation, { passive: true })
    return () => window.removeEventListener('scroll', updateNavigation)
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#100d18] text-white">
      <nav
        aria-label="Navegación de acceso"
        aria-hidden={!showNavigation}
        className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#100d18]/85 px-5 py-3 backdrop-blur-xl transition duration-300 sm:px-8 ${showNavigation ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="#inicio" className="font-semibold tracking-tight text-white" tabIndex={showNavigation ? 0 : -1}>
            Campus<span className="text-violet-300">Flow</span>
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            <a className="rounded-full px-3 py-2 text-sm text-violet-100 transition hover:bg-white/10" href="#iniciar-sesion" tabIndex={showNavigation ? 0 : -1}>
              Iniciar sesión
            </a>
            <Link className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400" to="/solicitar-cuenta" tabIndex={showNavigation ? 0 : -1}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      <section id="inicio" className="relative">
        <LampContainer>
          <div className="mb-7 grid h-14 w-14 place-items-center rounded-2xl border border-violet-200/20 bg-violet-300/10 text-violet-100 shadow-[0_0_50px_rgb(168_85_247_/_0.22)] sm:h-16 sm:w-16">
            <BookOpenCheck aria-hidden="true" className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-violet-200/80 sm:text-sm">Gestión académica, más clara</p>
          <h1 className="bg-gradient-to-b from-white via-violet-100 to-violet-300 bg-clip-text text-6xl font-semibold tracking-[-0.075em] text-transparent sm:text-8xl lg:text-[7.5rem]">
            Campus Flow
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-violet-100/70 sm:text-base">
            Todo tu campus conectado en un solo lugar.
          </p>
          <a className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white transition hover:border-violet-200/40 hover:bg-white/10" href="#iniciar-sesion">
            Explorar el acceso <ArrowDown aria-hidden="true" className="h-4 w-4" />
          </a>
        </LampContainer>
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-24 w-px -translate-x-1/2 bg-gradient-to-b from-violet-300/50 to-transparent" />
      </section>

      <section id="iniciar-sesion" className="scroll-mt-20 px-4 pb-20 pt-12 sm:px-8 sm:pt-16">
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
