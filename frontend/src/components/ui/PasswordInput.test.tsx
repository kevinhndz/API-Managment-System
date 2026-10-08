import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { PasswordInput } from './PasswordInput'

function ControlledPasswordInput() {
  const [value, setValue] = useState('')

  return (
    <PasswordInput
      id="test-password"
      label="Contraseña"
      name="password"
      onChange={setValue}
      value={value}
    />
  )
}

describe('PasswordInput', () => {
  afterEach(cleanup)

  it('actualiza la fortaleza y permite mostrar u ocultar el valor', () => {
    render(<ControlledPasswordInput />)

    const input = screen.getByLabelText('Contraseña')
    fireEvent.change(input, { target: { value: 'Abcdefghij1!' } })

    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '5')
    expect(screen.getByText('Muy fuerte')).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))

    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument()
  })

  it('puede ocultar el medidor para campos de confirmacion', () => {
    render(<PasswordInput id="confirmation" label="Confirmar contraseña" name="confirmation" onChange={() => undefined} showStrength={false} value="" />)

    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })
})
