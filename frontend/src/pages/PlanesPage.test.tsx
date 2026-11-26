import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializePaddle } from '@paddle/paddle-js'

import * as api from '../services/api'
import { PlanesPage } from './PlanesPage'

vi.mock('@paddle/paddle-js', () => ({ initializePaddle: vi.fn() }))
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Admin', email: 'admin@campus.edu', role: 'Administrador' } }) }))
vi.mock('../services/api', async (importOriginal) => ({
  ...await importOriginal<typeof import('../services/api')>(),
  obtenerSuscripcionInstitucional: vi.fn(), listarPlanesPublicos: vi.fn(), iniciarCheckoutInstitucional: vi.fn(),
  historialSuscripcion: vi.fn().mockResolvedValue([]), metodoPagoSuscripcion: vi.fn().mockResolvedValue({ method: null }),
}))

const piloto: api.SuscripcionInstitucional = {
  institucion_id: 1, plan_name: 'PILOTO', status: 'PRUEBA', active: false,
  current_period_start: '2026-10-01', current_period_end: '2026-11-01',
  cancel_at_period_end: false, has_paddle_subscription: false, checkout_pending: false, can_manage: true,
}
const abrir = vi.fn()

async function pulsarPagar() {
  const boton = await screen.findByRole('button', { name: 'Pagar plan mensual' })
  await waitFor(() => expect(boton).toBeEnabled())
  fireEvent.click(boton)
}

describe('pago institucional dentro de CampusFlow', () => {
  beforeEach(() => {
    vi.mocked(api.obtenerSuscripcionInstitucional).mockResolvedValue(piloto)
    vi.mocked(api.listarPlanesPublicos).mockResolvedValue([{ nombre: 'Institucional', importe: '2500', moneda: 'USD', intervalo: 'month', disponible: true }])
    vi.mocked(api.iniciarCheckoutInstitucional).mockResolvedValue({ transaction_id: 'txn_institucion', client_token: 'test_cliente', environment: 'sandbox' })
    vi.mocked(initializePaddle).mockResolvedValue({ Checkout: { open: abrir } } as unknown as Awaited<ReturnType<typeof initializePaddle>>)
  })
  afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers() })

  it('ofrece el plan mensual y abre el checkout superpuesto sin salir de Suscripción', async () => {
    render(<PlanesPage />)
    await pulsarPagar()
    await waitFor(() => expect(abrir).toHaveBeenCalledWith({ transactionId: 'txn_institucion', settings: { displayMode: 'overlay', theme: 'light' } }))
    expect(api.iniciarCheckoutInstitucional).toHaveBeenCalledWith('Institucional')
    expect(initializePaddle).toHaveBeenCalledWith(expect.objectContaining({ token: 'test_cliente', environment: 'sandbox' }))
    expect(screen.getByRole('option', { name: /25.*mes/ })).toBeInTheDocument()
    expect(screen.queryByText('Renovacion automatica')).not.toBeInTheDocument()
  })

  it('espera al backend y actualiza el acceso cuando llega la confirmación', async () => {
    render(<PlanesPage />)
    await pulsarPagar()
    await waitFor(() => expect(abrir).toHaveBeenCalled())
    vi.useFakeTimers()
    const callback = vi.mocked(initializePaddle).mock.calls[0][0]!.eventCallback!
    act(() => callback({ name: 'checkout.completed' } as Parameters<typeof callback>[0]))
    expect(screen.getByText(/esperando confirmacion del pago/i)).toBeInTheDocument()
    expect(screen.getByText('PRUEBA')).toBeInTheDocument()
    vi.mocked(api.obtenerSuscripcionInstitucional).mockResolvedValue({ ...piloto, status: 'ACTIVA', active: true, has_paddle_subscription: true })
    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
    expect(screen.getByText('ACTIVA')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pagar plan mensual' })).not.toBeInTheDocument()
  })

  it('permite continuar el pago pendiente sin cambiar el plan', async () => {
    vi.mocked(api.obtenerSuscripcionInstitucional).mockResolvedValue({ ...piloto, plan_name: 'Institucional', checkout_pending: true })
    render(<PlanesPage />)
    const continuar = await screen.findByRole('button', { name: 'Continuar pago' })
    await waitFor(() => expect(continuar).toBeEnabled())
    expect(screen.getByRole('combobox', { name: 'Plan mensual' })).toBeDisabled()
    fireEvent.click(continuar)
    await waitFor(() => expect(abrir).toHaveBeenCalledTimes(1))
  })

  it('muestra un fallo del proveedor y deja reintentar el pago', async () => {
    vi.mocked(api.iniciarCheckoutInstitucional).mockRejectedValue(new Error('No se pudo conectar con Paddle. Intenta de nuevo'))
    render(<PlanesPage />)
    await pulsarPagar()
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con Paddle')
    expect(screen.getByRole('button', { name: 'Pagar plan mensual' })).toBeEnabled()
    expect(abrir).not.toHaveBeenCalled()
  })

  it('una suscripción vigente se administra sin ofrecer otro checkout', async () => {
    vi.mocked(api.obtenerSuscripcionInstitucional).mockResolvedValue({ ...piloto, active: true, status: 'ACTIVA', has_paddle_subscription: true })
    render(<PlanesPage />)
    expect(await screen.findByRole('button', { name: 'Administrar plan' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pagar plan mensual' })).not.toBeInTheDocument()
  })
})
