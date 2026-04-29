import { ReactNode } from 'react'

export interface HeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-black/[0.06] px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between gap-4 max-w-screen-xl mx-auto">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
