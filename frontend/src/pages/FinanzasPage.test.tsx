import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { listar, crear, registrarPago } = vi.hoisted(() => ({ listar: vi.fn(), crear: vi.fn(), registrarPago: vi.fn() }))
vi.mock('../services/api', () => ({ finanzasApi: { listar, crear, registrarPago } }))
vi.mock('../hooks/useAcademicLabels', () => ({ useAcademicLabels: () => ({ estudianteOptions: [{ value: '4', label: '2026004 · Ana Lopez' }], docenteOptions: [{ value: '8', label: 'DOC-8 · Luis Perez' }] }) }))

import { FinanzasPage } from './FinanzasPage'

describe('FinanzasPage', () => {
  afterEach(() => { cleanup(); vi.clearAllMocks() })

  it('registra un pago contra un cobro pendiente', async () => {
    const pendiente = { id: 3, tipo: 'ESTUDIANTE', sujeto_id: 4, codigo: '2026004', persona: 'Ana Lopez', mes: '2026-10', concepto: 'Mensualidad', monto: '100.00', pagado: '0.00', saldo: '100.00', moneda: 'HNL', vence_en: '2026-10-30', estado: 'PENDIENTE' }
    listar.mockResolvedValue([pendiente])
    registrarPago.mockResolvedValue({ id: 1 })
    render(<FinanzasPage />)
    expect(await screen.findByText('Ana Lopez')).toBeInTheDocument()
    expect(screen.getByText('PENDIENTE')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Referencia unica' }), { target: { value: 'TRANS-001' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }))
    await waitFor(() => expect(registrarPago).toHaveBeenCalledWith(3, { referencia: 'TRANS-001', monto: 100, fecha: expect.any(String), metodo: 'Transferencia' }))
    expect(crear).not.toHaveBeenCalled()
  })
})
