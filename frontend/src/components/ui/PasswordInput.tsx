import { Check, Eye, EyeOff, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import './PasswordInput.css'

interface PasswordInputProps {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
  minLength?: number
  maxLength?: number
  required?: boolean
  showStrength?: boolean
}

interface PasswordRequirement {
  text: string
  met: boolean
  required: boolean
}

const strengthLabels = ['Sin evaluar', 'Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte']
const strengthColors = ['', '#ef4444', '#f97316', '#f59e0b', '#65a30d', '#059669']

export function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete = 'new-password',
  placeholder = 'Escribe tu contraseña',
  minLength = 12,
  maxLength = 72,
  required = true,
  showStrength = true,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  const requirements = useMemo<PasswordRequirement[]>(() => [
    { text: `Al menos ${minLength} caracteres`, met: value.length >= minLength, required: true },
    { text: 'Un número', met: /[0-9]/.test(value), required: false },
    { text: 'Una letra minúscula', met: /[a-z]/.test(value), required: false },
    { text: 'Una letra mayúscula', met: /[A-Z]/.test(value), required: false },
    { text: 'Un carácter especial', met: /[^a-zA-Z0-9]/.test(value), required: false },
  ], [minLength, value])

  const score = requirements.filter((requirement) => requirement.met).length
  const strengthId = `${id}-strength`

  return (
    <div className="password-input">
      <label className="password-input__label" htmlFor={id}>{label}</label>
      <div className="password-input__control">
        <input
          aria-describedby={showStrength ? strengthId : undefined}
          aria-invalid={value.length > 0 && value.length < minLength}
          autoComplete={autoComplete}
          className="password-input__field"
          id={id}
          maxLength={maxLength}
          minLength={minLength}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          type={visible ? 'text' : 'password'}
          value={value}
        />
        <button
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="password-input__toggle"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          <span className="password-input__toggle-icon" key={visible ? 'visible' : 'hidden'}>
            {visible ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
          </span>
        </button>
      </div>

      {showStrength && (
        <div aria-live="polite" className="password-input__strength" id={strengthId}>
          <div aria-label={`Fortaleza: ${strengthLabels[score]}`} className="password-input__meter" role="meter" aria-valuemin={0} aria-valuemax={5} aria-valuenow={score}>
            {requirements.map((requirement) => (
              <span
                aria-hidden="true"
                className="password-input__segment"
                key={requirement.text}
                style={requirement.met ? { backgroundColor: strengthColors[score] } : undefined}
              />
            ))}
          </div>
          <div className="password-input__summary">
            <span>Fortaleza</span>
            <strong className={score < 3 ? 'text-[#9b2630] dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'} key={`${id}-strength-${score}`}>
              {strengthLabels[score]}
            </strong>
          </div>
          <p className="password-input__hint">Se requiere la longitud mínima; los demás indicadores son recomendaciones de seguridad.</p>
          <ul aria-label="Requisitos y recomendaciones de contraseña" className="password-input__requirements">
            {requirements.map((requirement) => (
              <li className={requirement.met ? 'is-met' : ''} key={requirement.text}>
                {requirement.met
                  ? <Check aria-hidden="true" className="password-input__requirement-icon" size={15} />
                  : <X aria-hidden="true" className="password-input__requirement-icon" size={15} />}
                <span>{requirement.text}</span>
                <span className="password-input__requirement-kind">{requirement.required ? 'Obligatorio' : 'Recomendado'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
