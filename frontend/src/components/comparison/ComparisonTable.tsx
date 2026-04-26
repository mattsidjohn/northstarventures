import { Property, Scorecard } from '@northstar/shared-types'
import { ComparisonMetric, METRIC_OPTIONS } from './MetricSelector'
import ScoreBadge from '../ui/ScoreBadge'
import DecisionLabel from '../ui/DecisionLabel'
import { formatCurrency, formatPercent } from '../../utils/format'

export interface ComparisonRow {
  property: Property
  scorecard?: Scorecard
  cashFlow: number
  expenseRatio: number
  capRate: number
}

export interface ComparisonTableProps {
  rows: ComparisonRow[]
  metric: ComparisonMetric
}

function formatMetricValue(row: ComparisonRow, metric: ComparisonMetric): string {
  switch (metric) {
    case 'overallScore': return row.scorecard?.overallScore.toFixed(1) ?? '—'
    case 'cashFlow': return formatCurrency(row.cashFlow)
    case 'expenseRatio': return formatPercent(row.expenseRatio * 100)
    case 'capRate': return formatPercent(row.capRate, 1)
  }
}

function getMetricRawValue(row: ComparisonRow, metric: ComparisonMetric): number {
  switch (metric) {
    case 'overallScore': return row.scorecard?.overallScore ?? 0
    case 'cashFlow': return row.cashFlow
    case 'expenseRatio': return -row.expenseRatio
    case 'capRate': return row.capRate
  }
}

export default function ComparisonTable({ rows, metric }: ComparisonTableProps) {
  const metricLabel = METRIC_OPTIONS.find(m => m.value === metric)?.label ?? metric
  const sorted = [...rows].sort((a, b) => getMetricRawValue(b, metric) - getMetricRawValue(a, metric))
  const bestValue = sorted[0] ? getMetricRawValue(sorted[0], metric) : null
  const worstValue = sorted[sorted.length - 1] ? getMetricRawValue(sorted[sorted.length - 1], metric) : null

  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">Select at least one property to compare.</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl shadow-card">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Rank</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Property</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{metricLabel}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Score</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Decision</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {sorted.map((row, i) => {
            const rawVal = getMetricRawValue(row, metric)
            const isBest = rawVal === bestValue
            const isWorst = rawVal === worstValue && rows.length > 1
            const decision = row.scorecard?.userDecisionOverride ?? row.scorecard?.recommendedDecision

            return (
              <tr key={row.property.id} className={isBest ? 'bg-emerald-50' : isWorst ? 'bg-red-50' : ''}>
                <td className="px-4 py-3 font-bold text-gray-400">#{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{row.property.name}</p>
                  <p className="text-xs text-gray-400">{row.property.units} units</p>
                </td>
                <td className={`px-4 py-3 font-semibold ${isBest ? 'text-emerald-700' : isWorst ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatMetricValue(row, metric)}
                  {isBest && <span className="ml-1 text-xs text-emerald-500">↑ best</span>}
                  {isWorst && <span className="ml-1 text-xs text-red-400">↓ worst</span>}
                </td>
                <td className="px-4 py-3">
                  {row.scorecard ? <ScoreBadge score={row.scorecard.overallScore} size="sm" /> : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {decision ? <DecisionLabel decision={decision} size="sm" /> : <span className="text-gray-400">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
