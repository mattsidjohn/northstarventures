import StatCard from '../ui/StatCard'
import { formatCurrency } from '../../utils/format'

export interface DashboardStats {
  totalProperties: number
  totalUnits: number
  totalPurchasePrice: number
  totalBaseValue: number
  projectedAnnualIncome: number
  projectedAnnualExpenses: number
  projectedAnnualCashFlow: number
}

export interface PortfolioStatsProps {
  stats: DashboardStats
}

export default function PortfolioStats({ stats }: PortfolioStatsProps) {
  const { totalProperties, totalUnits, totalPurchasePrice, totalBaseValue, projectedAnnualIncome, projectedAnnualExpenses, projectedAnnualCashFlow } = stats

  const monthlyIncome = projectedAnnualIncome / 12
  const monthlyExpenses = projectedAnnualExpenses / 12
  const monthlyCashFlow = projectedAnnualCashFlow / 12

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        label="Properties"
        value={totalProperties}
        sub={`${totalUnits} total units`}
      />
      <StatCard
        label="Cost Basis"
        value={formatCurrency(totalPurchasePrice, true)}
        sub={`Est. value: ${formatCurrency(totalBaseValue, true)}`}
      />
      <StatCard
        label="Projected Revenue"
        value={`${formatCurrency(projectedAnnualIncome, true)}/yr`}
        sub={`${formatCurrency(monthlyIncome, true)}/mo`}
      />
      <StatCard
        label="Projected Expenses"
        value={`${formatCurrency(projectedAnnualExpenses, true)}/yr`}
        sub={`${formatCurrency(monthlyExpenses, true)}/mo`}
      />
      <StatCard
        label="Projected Cash Flow"
        value={`${formatCurrency(projectedAnnualCashFlow, true)}/yr`}
        trend={projectedAnnualCashFlow >= 0 ? 'up' : 'down'}
        sub={`${formatCurrency(monthlyCashFlow, true)}/mo`}
      />
    </div>
  )
}
