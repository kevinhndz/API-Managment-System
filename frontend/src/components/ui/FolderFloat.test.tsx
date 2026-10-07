import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FolderFloat } from './FolderFloat'

afterEach(cleanup)

describe('FolderFloat', () => {
  it('abre las opciones al pasar el puntero y envia la seleccion', () => {
    const onSelect = vi.fn()

    render(
      <FolderFloat
        items={[{ label: 'Ver carnet', value: 'carnet' }, { label: 'Editar', value: 'editar' }, { label: 'Eliminar', value: 'eliminar' }]}
        label="Acciones"
        physics={false}
        onSelect={onSelect}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Acciones' })
    const folder = trigger.closest('.folder-float')
    expect(folder).not.toBeNull()
    fireEvent.pointerEnter(folder!)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ver carnet' }))

    expect(onSelect).toHaveBeenCalledWith('carnet', 0)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
