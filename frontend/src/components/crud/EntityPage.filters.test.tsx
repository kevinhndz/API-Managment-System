import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EntityPage } from './EntityPage'

interface Room { id: number; building: string; active: boolean }
interface RoomPayload { building: string }

describe('EntityPage filters', () => {
  it('applies a filter to all API pages, not only the visible page', async () => {
    const list = vi.fn(async ({ pagina_actual = 1 }: { pagina_actual?: number } = {}) => pagina_actual === 1
      ? { total: 2, pagina_actual: 1, limite: 100, total_paginas: 2, data: [{ id: 1, building: 'North', active: true }] }
      : { total: 2, pagina_actual: 2, limite: 100, total_paginas: 2, data: [{ id: 2, building: 'South', active: true }] })
    const service = { list, get: vi.fn(), create: vi.fn(), update: vi.fn(), patch: vi.fn(), remove: vi.fn() }

    render(<EntityPage<Room, RoomPayload>
      title="Aulas" description="Listado" singular="Aula" newLabel="Nueva aula" service={service}
      columns={[{ label: 'Edificio', render: (room) => room.building }]}
      fields={[]} emptyPayload={{ building: '' }} toPayload={(room) => ({ building: room.building })}
      searchableText={(room) => room.building}
      filters={[{ key: 'building', label: 'Edificio', options: [{ value: 'North', label: 'Norte' }, { value: 'South', label: 'Sur' }], getValue: (room) => room.building }]}
    />)

    await screen.findByText('North')
    fireEvent.click(screen.getByRole('button', { name: /filtros/i }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por edificio' }), { target: { value: 'South' } })

    expect(await screen.findByText('South')).toBeInTheDocument()
    expect(screen.queryByText('North')).not.toBeInTheDocument()
    await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ pagina_actual: 2, limite: 100 })))
    expect(screen.getByText('Se encontraron 1 registros filtrados')).toBeInTheDocument()
  })
})
