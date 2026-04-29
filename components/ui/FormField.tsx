import { InputHTMLAttributes, ReactNode } from 'react'

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  children?: ReactNode
}

export default function FormField({ label, error, hint, children, id, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
        {label}
      </label>
      {children ?? (
        <input
          id={fieldId}
          className={`px-4 py-3 text-[15px] bg-white rounded-xl border transition-shadow placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
            error ? 'border-red-400 bg-red-50 ring-2 ring-red-400' : 'border-gray-300'
          }`}
          {...inputProps}
        />
      )}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
