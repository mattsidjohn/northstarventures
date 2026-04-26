export type ComparisonMetric =
  | 'overallScore'
  | 'cashFlow'
  | 'expenseRatio'
  | 'capRate'

export const METRIC_OPTIONS: { value: ComparisonMetric; label: string }[] = [
  { value: 'overallScore', label: 'Overall Score' },
  { value: 'cashFlow', label: 'Cash Flow' },
  { value: 'expenseRatio', label: 'Expense Ratio' },
  { value: 'capRate', label: 'Cap Rate' },
]

export interface MetricSelectorProps {
  value: ComparisonMetric
  onChange: (metric: ComparisonMetric) => void
}

export default function MetricSelector({ value, onChange }: MetricSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Compare By</p>
      <select
        value={value}
        onChange={e => onChange(e.target.value as ComparisonMetric)}
        className="px-4 py-3 text-[15px] bg-gray-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
      >
        {METRIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
