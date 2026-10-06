import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { AuthProvider } from '../contexts/AuthContext'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  afterEach(() => localStorage.clear())

  it('muestra el formulario de acceso real', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Usuario')).toBeVisible()
    expect(screen.queryByText('Acceso de demostración')).not.toBeInTheDocument()
  })
})
