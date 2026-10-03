import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { AuthProvider } from '../contexts/AuthContext'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  afterEach(() => localStorage.clear())

  it('permite completar la cuenta de demostración', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Completar' }))
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('admin@campusflow.edu')
    expect(screen.getByLabelText('Contraseña')).toHaveValue('Campus2026')
  })
})
