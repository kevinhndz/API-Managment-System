import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import { ConfiguracionPage } from './ConfiguracionPage'
import { PerfilPage } from './PerfilPage'
import { RecuperacionPage } from './RecuperacionPage'

vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

describe('secciones de Settings', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra perfil y bandeja para administración y regreso al dashboard', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { name: 'admin', email: 'admin@campus.edu', role: 'Administrador', photo: null },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      updateProfile: vi.fn(),
      updateProfilePhoto: vi.fn(),
      logout: vi.fn(),
    })
    render(<MemoryRouter><ConfiguracionPage /></MemoryRouter>)

    expect(screen.getByRole('link', { name: /volver al dashboard/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /editar perfil/i })).toHaveAttribute('href', '/configuracion/perfil')
    expect(screen.getByRole('link', { name: /bandeja de solicitudes/i })).toHaveAttribute('href', '/configuracion/solicitudes')
    expect(screen.queryByText('Recuperacion de contrasena')).not.toBeInTheDocument()
  })

  it('guarda nombre y correo y ofrece recuperación dentro del perfil', async () => {
    const updateProfile = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useAuth).mockReturnValue({
      user: { name: 'admin', email: 'admin@campus.edu', role: 'Administrador', photo: null },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      updateProfile,
      updateProfilePhoto: vi.fn(),
      logout: vi.fn(),
    })
    const user = userEvent.setup()
    render(<MemoryRouter><PerfilPage /></MemoryRouter>)

    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'Ana Campus')
    await user.clear(screen.getByLabelText('Correo electrónico'))
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@campus.edu')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(updateProfile).toHaveBeenCalledWith('Ana Campus', 'ana@campus.edu')
    expect(await screen.findByText('Tu perfil se actualizó correctamente.')).toHaveAttribute('role', 'status')
    expect(screen.getByRole('link', { name: /recuperación de contraseña/i })).toHaveAttribute('href', '/configuracion/recuperacion')
  })

  it('sube una foto permitida desde editar perfil', async () => {
    const updateProfilePhoto = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useAuth).mockReturnValue({
      user: { name: 'Ana Campus', email: 'ana@campus.edu', role: 'Docente', photo: null },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      updateProfile: vi.fn(),
      updateProfilePhoto,
      logout: vi.fn(),
    })
    const user = userEvent.setup()
    render(<MemoryRouter><PerfilPage /></MemoryRouter>)

    await user.upload(screen.getByLabelText('Seleccionar foto de perfil'), new File(['image'], 'perfil.png', { type: 'image/png' }))

    expect(updateProfilePhoto).toHaveBeenCalledOnce()
    expect(updateProfilePhoto.mock.calls[0][0]).toBeInstanceOf(File)
    expect(screen.getByText('Agrega una foto para completar tu perfil.')).toBeInTheDocument()
  })

  it('la recuperación incrustada regresa al perfil, no al login', () => {
    render(<MemoryRouter><RecuperacionPage embedded backTo="/configuracion/perfil" /></MemoryRouter>)

    expect(screen.getByRole('link', { name: /volver a editar perfil/i })).toHaveAttribute('href', '/configuracion/perfil')
  })
})
