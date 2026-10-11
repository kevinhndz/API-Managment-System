import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  confirmarCodigoVerificacionCuenta,
  solicitarCodigoVerificacionCuenta,
  solicitarCuenta,
} from '../services/api'
import { SolicitudCuentaPage } from './SolicitudCuentaPage'

vi.mock('../services/api', () => ({
  confirmarCodigoVerificacionCuenta: vi.fn(),
  solicitarCodigoVerificacionCuenta: vi.fn(),
  solicitarCuenta: vi.fn(),
}))

describe('SolicitudCuentaPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('solo envía la solicitud después de confirmar el código de correo', async () => {
    const user = userEvent.setup()
    vi.mocked(solicitarCodigoVerificacionCuenta).mockResolvedValue({
      verificacion_id: 'verificacion-prueba-000000000000000000000000',
      expires_in_seconds: 600,
      resend_after_seconds: 60,
      detail: 'Código enviado.',
    })
    vi.mocked(confirmarCodigoVerificacionCuenta).mockResolvedValue({
      ticket_verificacion: 'ticket-verificado-de-prueba',
      detail: 'Correo verificado.',
    })
    vi.mocked(solicitarCuenta).mockResolvedValue({ detail: 'Solicitud recibida.' })

    render(<MemoryRouter><SolicitudCuentaPage /></MemoryRouter>)
    await user.type(screen.getByLabelText('Nombre completo'), 'Ana Nueva')
    await user.type(screen.getByLabelText('Correo'), 'ana@uphn.edu')
    await user.type(screen.getByLabelText('Usuario'), 'ana.nueva')
    await user.type(screen.getByLabelText('Contraseña'), 'Clave-segura-2026!')
    await user.click(screen.getByRole('button', { name: /Enviar código al correo/i }))

    expect(await screen.findByText(/Enviamos un código de 6 dígitos/i)).toBeVisible()
    expect(solicitarCodigoVerificacionCuenta).toHaveBeenCalledWith('ana@uphn.edu')
    expect(solicitarCuenta).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Código de verificación de seis dígitos'), {
      target: { value: '123456' },
    })
    await user.click(screen.getByRole('button', { name: 'Verificar código' }))
    expect(await screen.findByText(/Correo confirmado/i)).toBeVisible()
    expect(confirmarCodigoVerificacionCuenta).toHaveBeenCalledWith(
      'verificacion-prueba-000000000000000000000000',
      '123456',
    )
    expect(solicitarCuenta).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /Enviar solicitud/i }))
    await waitFor(() => expect(solicitarCuenta).toHaveBeenCalledWith({
      nombre_completo: 'Ana Nueva',
      correo: 'ana@uphn.edu',
      usuario: 'ana.nueva',
      contrasena: 'Clave-segura-2026!',
      ticket_verificacion: 'ticket-verificado-de-prueba',
    }))
    expect(await screen.findByRole('heading', { name: 'Solicitud enviada' })).toBeVisible()
  })
})
