import { formatCurrency } from '@/utils/format'

export interface PortfolioROIBarProps {
  totalPurchasePrice: number
  totalBaseValue: number       // est. current value per property, or purchase price if not set
  projectedAnnualCashFlow: number
}

export default function PortfolioROIBar({ totalPurchasePrice, totalBaseValue, projectedAnnualCashFlow }: PortfolioROIBarProps) {
  if (totalPurchasePrice === 0) return null

  const data = [1, 2, 3, 4].map(year => {
    const appreciationGain = totalBaseValue * (1.03 ** year) - totalPurchasePrice
    const cashFlowGain = projectedAnnualCashFlow * year
    const totalReturn = appreciationGain + cashFlowGain
    const roiPct = (totalReturn / totalPurchasePrice) * 100
    return { year, totalReturn, roiPct }
  })

  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="flex items-baseline justify-between mb-5">
        <p className="text-sm font-semibold text-gray-700">Portfolio ROI Forecast</p>
        <p className="text-xs text-gray-400">3% annual appreciation · projected cash flow</p>
      </div>
      <div className="grid grid-cols-4 divide-x divide-gray-100">
        {data.map(({ year, totalReturn, roiPct }) => (
          <div key={year} className="text-center px-4 first:pl-0 last:pr-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Year {year}</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalReturn, true)}</p>
            <p className={`text-sm font-semibold mt-1 ${roiPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {roiPct >= 0 ? '+' : ''}{roiPct.toFixed(1)}% ROI
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
