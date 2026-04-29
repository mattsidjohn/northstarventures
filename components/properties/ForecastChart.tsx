'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface ForecastChartProps {
  purchasePrice: number
  baseValue: number          // estimatedCurrentValue if set, otherwise purchasePrice
  avgMonthlyCashFlow: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: ReturnType<typeof buildData>[0] }>
  label?: string
}

function buildData(purchasePrice: number, baseValue: number, avgMonthlyCashFlow: number) {
  const annualCF = avgMonthlyCashFlow * 12
  return [1, 2, 3, 4, 5].map(year => {
    const projectedValue = Math.round(baseValue * (1.03 ** year))
    const appreciationGain = projectedValue - purchasePrice
    const cashFlowGain = Math.round(annualCF * year)
    const totalReturn = appreciationGain + cashFlowGain
    const roi = purchasePrice > 0 ? (totalReturn / purchasePrice) * 100 : 0
    return {
      label: `Year ${year}`,
      roi: parseFloat(roi.toFixed(1)),
      appreciationGain,
      cashFlowGain,
      totalReturn,
    }
  })
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-md text-xs space-y-1 min-w-[160px]">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      <p className="text-blue-500">
        Appreciation: ${d.appreciationGain.toLocaleString()}
      </p>
      <p className="text-emerald-500">
        Cash Flow: ${d.cashFlowGain.toLocaleString()}
      </p>
      <p className="text-gray-700 font-semibold border-t border-gray-100 pt-1 mt-1">
        Total Return: ${d.totalReturn.toLocaleString()}
      </p>
      <p className="text-brand-600 font-bold text-sm">{d.roi.toFixed(1)}% ROI</p>
    </div>
  )
}

export default function ForecastChart({ purchasePrice, baseValue, avgMonthlyCashFlow }: ForecastChartProps) {
  const data = buildData(purchasePrice, baseValue, avgMonthlyCashFlow)

  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <p className="text-sm font-semibold text-gray-700 mb-0.5">5-Year ROI Forecast</p>
      <p className="text-xs text-gray-400 mb-4">
        Based on purchase price · 3% annual appreciation · current avg cash flow
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="roi"
            name="ROI"
            stroke="#3b82f6"
            fill="url(#roiGradient)"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
