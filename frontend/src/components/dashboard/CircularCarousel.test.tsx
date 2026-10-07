import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { CircularCarousel } from './CircularCarousel'

const items = [
  { src: '/aulas.jpg', alt: 'Aula', title: 'Aulas', subtitle: '12 registradas' },
  { src: '/docentes.jpg', alt: 'Docente', title: 'Docentes', subtitle: '8 activos' },
]

afterEach(cleanup)

describe('CircularCarousel', () => {
  it('presenta un album de tarjetas y revela sus datos al pasar el puntero', () => {
    render(<CircularCarousel items={items} />)

    expect(screen.getByRole('region', { name: 'Album de metricas del campus' })).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(2)
    expect(screen.getByText('01 / 02')).toBeInTheDocument()

    const aulas = screen.getByRole('button', { name: 'Aulas: 12 registradas' })
    fireEvent.pointerEnter(aulas, { pointerType: 'mouse' })

    expect(within(aulas).getByText('12 registradas')).toBeInTheDocument()
    expect(aulas).toHaveClass('is-previewed')
  })

  it('permite cambiar de tarjeta con controles y teclado', async () => {
    const user = userEvent.setup()
    render(<CircularCarousel items={items} />)

    await user.click(screen.getByRole('button', { name: 'Tarjeta siguiente' }))
    expect(screen.getByText('02 / 02')).toBeInTheDocument()
    expect(within(screen.getByRole('button', { name: 'Docentes: 8 activos' })).getByText('8 activos')).toBeInTheDocument()

    const stage = screen.getByRole('region', { name: 'Album de metricas del campus' })
    stage.focus()
    await user.keyboard('{ArrowLeft}')

    expect(screen.getByText('01 / 02')).toBeInTheDocument()
    expect(within(screen.getByRole('button', { name: 'Aulas: 12 registradas' })).getByText('12 registradas')).toBeInTheDocument()
  })

  it('explica cuando no hay metricas', () => {
    render(<CircularCarousel items={[]} />)

    expect(screen.getByText('No hay metricas para mostrar.')).toBeInTheDocument()
  })
})
