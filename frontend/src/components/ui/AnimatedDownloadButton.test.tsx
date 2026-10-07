import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AnimatedDownloadButton } from './AnimatedDownloadButton'

afterEach(cleanup)

describe('AnimatedDownloadButton', () => {
  it('inicia la descarga del formato seleccionado al pulsarlo', () => {
    const onClick = vi.fn()

    render(<AnimatedDownloadButton label="Excel" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Descargar Excel' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('anuncia cuando esta generando y evita otra solicitud', () => {
    render(<AnimatedDownloadButton label="PDF" loading onClick={vi.fn()} />)

    const button = screen.getByRole('button', { name: 'Generando PDF' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Generando…')).toBeInTheDocument()
  })
})
