import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ActionMenu } from './ActionMenu'

describe('ActionMenu', () => {
  it('muestra y ejecuta una accion adicional sin cambiar las acciones CRUD', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const onView = vi.fn()

    render(
      <ActionMenu
        singular="Estudiante"
        onEdit={onEdit}
        onDelete={onDelete}
        extraAction={{ label: 'Ver carnet', icon: <span aria-hidden="true">ID</span>, onSelect: onView }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /acciones/i }))

    expect(screen.getByRole('menuitem', { name: /ver carnet/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /eliminar/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('menuitem', { name: /ver carnet/i }))

    expect(onView).toHaveBeenCalledOnce()
    expect(onEdit).not.toHaveBeenCalled()
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
