import { periodLabel } from '@/utils/format'

export interface PeriodSelectorProps {
  year: number
  period: 'H1' | 'H2'
  onYearChange: (year: number) => void
  onPeriodChange: (period: 'H1' | 'H2') => void
}

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

export default function PeriodSelector({ year, period, onYearChange, onPeriodChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <select
        value={year}
        onChange={e => onYearChange(parseInt(e.target.value))}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <div className="flex rounded-lg border border-gray-300 overflow-hidden">
        {(['H1', 'H2'] as const).map(p => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              period === p ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p} · {p === 'H1' ? 'Jan–Jun' : 'Jul–Dec'}
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-500">{periodLabel(year, period)}</span>
    </div>
  )
}
