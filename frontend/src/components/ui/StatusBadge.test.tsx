import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('presenta el estado activo con el icono de confirmación', () => {
    render(<StatusBadge active />)

    expect(screen.getByRole('status', { name: 'Estado: Activo' })).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('presenta el estado inactivo con el icono de prohibición', () => {
    render(<StatusBadge active={false} />)

    expect(screen.getByRole('status', { name: 'Estado: Inactivo' })).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('permite mantener el género del estado de matrícula sin cambiar su significado', () => {
    render(<StatusBadge active activeLabel="Activa" />)

    expect(screen.getByRole('status', { name: 'Estado: Activa' })).toBeInTheDocument()
  })
})
