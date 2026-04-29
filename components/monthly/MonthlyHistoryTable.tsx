import { MonthlyData } from '@/types'
import { MONTH_NAMES, formatCurrency } from '@/utils/format'

export interface MonthlyHistoryTableProps {
  monthlyData: MonthlyData[]
  onEdit?: (entry: MonthlyData) => void
  onDelete?: (id: string) => void
}

export default function MonthlyHistoryTable({ monthlyData, onEdit, onDelete }: MonthlyHistoryTableProps) {
  if (monthlyData.length === 0) {
    return <p className="text-sm text-gray-400 py-4">No monthly data entered yet.</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl shadow-card">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {['Month', 'Income', 'Expenses', 'Cash Flow', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {monthlyData.map(d => {
            const cashFlow = d.income - d.expenses
            return (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{MONTH_NAMES[d.month - 1]} {d.year}</td>
                <td className="px-4 py-3">{formatCurrency(d.income)}</td>
                <td className="px-4 py-3">{formatCurrency(d.expenses)}</td>
                <td className={`px-4 py-3 font-medium ${cashFlow < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{formatCurrency(cashFlow)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {onEdit && <button onClick={() => onEdit(d)} className="text-xs text-brand-600 hover:underline">Edit</button>}
                    {onDelete && <button onClick={() => onDelete(d.id)} className="text-xs text-red-500 hover:underline">Delete</button>}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
