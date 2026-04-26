import { ReactNode } from 'react'

export interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  children?: ReactNode
  className?: string
}

const TREND_ICONS = { up: '↑', down: '↓', neutral: '→' }
const TREND_COLORS = { up: 'text-emerald-500', down: 'text-red-500', neutral: 'text-gray-400' }

export default function StatCard({ label, value, sub, trend, children, className = '' }: StatCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-card p-5 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <div className="mt-2 flex items-end gap-1.5">
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {trend && (
          <span className={`mb-0.5 text-sm font-semibold ${TREND_COLORS[trend]}`}>
            {TREND_ICONS[trend]}
          </span>
        )}
      </div>
      {sub && <p className="mt-1 text-xs text-gray-400 font-medium">{sub}</p>}
      {children}
    </div>
  )
}
