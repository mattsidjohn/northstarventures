import { Property } from '@northstar/shared-types'
import { MONTH_NAMES } from '../../utils/format'

export interface MonthSelectorProps {
  properties: Property[]
  selectedPropertyId: string | null
  selectedYear: number
  selectedMonth: number
  onPropertyChange: (id: string) => void
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
}

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

const selectClass = 'px-4 py-3 text-[15px] bg-gray-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow'

export default function MonthSelector({
  properties, selectedPropertyId, selectedYear, selectedMonth,
  onPropertyChange, onYearChange, onMonthChange,
}: MonthSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1.5 min-w-[200px]">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</label>
        <select
          value={selectedPropertyId ?? ''}
          onChange={e => onPropertyChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Select a property…</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</label>
        <select
          value={selectedYear}
          onChange={e => onYearChange(parseInt(e.target.value))}
          className={selectClass}
        >
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</label>
        <select
          value={selectedMonth}
          onChange={e => onMonthChange(parseInt(e.target.value))}
          className={selectClass}
        >
          {MONTH_NAMES.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
        </select>
      </div>
    </div>
  )
}
