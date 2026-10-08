import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { ExpandableSearchBar } from './ExpandableSearchBar'

function ControlledSearch() {
  const [value, setValue] = useState('')

  return (
    <ExpandableSearchBar
      ariaLabel="Buscar estudiantes"
      onChange={setValue}
      placeholder="Buscar estudiantes..."
      value={value}
    />
  )
}

describe('ExpandableSearchBar', () => {
  afterEach(cleanup)

  it('abre el campo, permite escribir y lo enfoca', async () => {
    render(<ControlledSearch />)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir búsqueda' }))

    const input = await screen.findByRole('searchbox', { name: 'Buscar estudiantes' })
    await waitFor(() => expect(input).toHaveFocus())

    fireEvent.change(input, { target: { value: 'Ana' } })

    expect(input).toHaveValue('Ana')
  })

  it('Escape limpia el texto y cierra la búsqueda', async () => {
    render(<ControlledSearch />)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir búsqueda' }))
    const input = await screen.findByRole('searchbox', { name: 'Buscar estudiantes' })
    fireEvent.change(input, { target: { value: 'Ana' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Abrir búsqueda' })).toBeInTheDocument()
      expect(screen.queryByRole('searchbox', { name: 'Buscar estudiantes' })).not.toBeInTheDocument()
    })
  })
})
