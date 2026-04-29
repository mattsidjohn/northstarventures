'use client'

import { useState, useEffect, useRef, FocusEvent } from 'react'
import FormField, { FormFieldProps } from '@/components/ui/FormField'

export interface CurrencyInputProps extends Omit<FormFieldProps, 'type' | 'value' | 'onChange' | 'children'> {
  value: number
  onChange: (value: number) => void
}

export default function CurrencyInput({ value, onChange, label, error, hint, id, ...rest }: CurrencyInputProps) {
  const [display, setDisplay] = useState(() => (value === 0 ? '' : value.toString()))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) {
      setDisplay(value === 0 ? '' : value.toString())
    }
  }, [value])

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    focused.current = false
    const num = parseFloat(e.target.value.replace(/[^0-9.-]/g, ''))
    const safe = isNaN(num) ? 0 : num
    onChange(safe)
    setDisplay(safe === 0 ? '' : safe.toString())
    rest.onBlur?.(e)
  }

  return (
    <FormField label={label} error={error} hint={hint} id={id}>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[15px] font-medium">$</span>
        <input
          id={id ?? label.toLowerCase().replace(/\s+/g, '-')}
          type="text"
          inputMode="decimal"
          value={display}
          onChange={e => setDisplay(e.target.value)}
          onFocus={() => { focused.current = true }}
          onBlur={handleBlur}
          placeholder="0"
          className={`w-full pl-8 pr-4 py-3 text-[15px] bg-white rounded-xl border transition-shadow placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
            error ? 'border-red-400 bg-red-50 ring-2 ring-red-400' : 'border-gray-300'
          }`}
          {...rest}
        />
      </div>
    </FormField>
  )
}
