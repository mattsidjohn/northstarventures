import { formatCurrency } from '@/utils/format'

export interface MonthlyMetricsBarProps {
  income: number
  expenses: number
}

export default function MonthlyMetricsBar({ income, expenses }: MonthlyMetricsBarProps) {
  const cashFlow = income - expenses

  const Metric = ({ label, value, positive }: { label: string; value: string; positive?: boolean }) => (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className={`text-sm font-bold ${positive === false ? 'text-red-600' : positive === true ? 'text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )

  return (
    <div className="bg-brand-50 border border-brand-100 rounded-xl px-5 py-3 flex flex-wrap gap-6">
      <Metric label="Income" value={formatCurrency(income)} />
      <Metric label="Expenses" value={formatCurrency(expenses)} />
      <Metric label="Cash Flow" value={formatCurrency(cashFlow)} positive={cashFlow >= 0} />
    </div>
  )
}
