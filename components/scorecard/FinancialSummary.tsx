import { SemiAnnualMetrics } from '@/types'
import { formatCurrency } from '@/utils/format'

export interface FinancialSummaryProps {
  metrics: SemiAnnualMetrics
}

export default function FinancialSummary({ metrics }: FinancialSummaryProps) {
  const { totals, averages } = metrics

  const rows: [string, string, string?][] = [
    ['Total Income', formatCurrency(totals.income)],
    ['Total Expenses', formatCurrency(totals.expenses)],
    ['Cash Flow', formatCurrency(totals.cashFlow), totals.cashFlow < 0 ? 'text-red-600' : 'text-emerald-700'],
    ['Avg Monthly Income', formatCurrency(averages.monthlyIncome)],
    ['Avg Monthly Cash Flow', formatCurrency(averages.monthlyCashFlow), averages.monthlyCashFlow < 0 ? 'text-red-600' : 'text-emerald-700'],
  ]

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Financial Summary</p>
      </div>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100">
          {rows.map(([label, value, colorClass]) => (
            <tr key={label}>
              <td className="px-5 py-2.5 text-gray-600">{label}</td>
              <td className={`px-5 py-2.5 text-right font-medium ${colorClass ?? 'text-gray-900'}`}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
