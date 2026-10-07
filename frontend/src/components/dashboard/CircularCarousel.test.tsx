import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { CircularCarousel } from './CircularCarousel'

const items = [
  { src: '/aulas.jpg', alt: 'Aula', title: 'Aulas', subtitle: '12 registradas' },
  { src: '/docentes.jpg', alt: 'Docente', title: 'Docentes', subtitle: '8 activos' },
]

afterEach(cleanup)

describe('CircularCarousel', () => {
  it('muestra las tarjetas quietas y revela la informacion al seleccionarlas', () => {
    render(<CircularCarousel items={items} />)

    expect(screen.getByText('Selecciona una tarjeta para ver su información.')).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(2)

    const aulas = screen.getByRole('button', { name: 'Ver información de Aulas' })
    fireEvent.click(aulas)

    expect(aulas).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('12 registradas')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ver información de Docentes' }))
    expect(aulas).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('8 activos')).toBeInTheDocument()
    expect(screen.queryByText('12 registradas')).not.toBeInTheDocument()
  })

  it('permite cerrar el detalle y activar la tarjeta con teclado', async () => {
    const user = userEvent.setup()
    render(<CircularCarousel items={items} />)

    const docentes = screen.getByRole('button', { name: 'Ver información de Docentes' })
    await user.tab()
    await user.tab()
    expect(docentes).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByText('8 activos')).toBeInTheDocument()

    await user.keyboard('{Enter}')
    expect(screen.getByText('Selecciona una tarjeta para ver su información.')).toBeInTheDocument()
  })
})
