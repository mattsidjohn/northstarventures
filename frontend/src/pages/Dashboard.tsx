import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scorecard } from '@northstar/shared-types'
import Header from '../components/layout/Header'
import PageContainer from '../components/layout/PageContainer'
import PortfolioStats from '../components/dashboard/PortfolioStats'
import PortfolioROIBar from '../components/dashboard/PortfolioROIBar'
import PropertyGrid from '../components/dashboard/PropertyGrid'
import WatchlistPanel from '../components/dashboard/WatchlistPanel'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useProperties } from '../hooks/useProperties'
import { api } from '../api/client'
import { calculateTrailing3MonthsMetrics } from '../utils/metricsClient'
import { computeLiveScorecard, mergeLiveWithStored } from '../utils/scorecardClient'

interface DashboardStats {
  totalProperties: number
  totalUnits: number
  projectedAnnualIncome: number
  projectedAnnualExpenses: number
  projectedAnnualCashFlow: number
  totalPurchasePrice: number
  totalBaseValue: number
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { properties, loading: propsLoading } = useProperties()
  const [scorecards, setScorecards] = useState<Scorecard[]>([])
  const [cashFlowMap, setCashFlowMap] = useState<Record<string, number>>({})
  const [portfolioStats, setPortfolioStats] = useState<DashboardStats | null>(null)
  const [entryNeededIds, setEntryNeededIds] = useState<Set<string>>(new Set())

  // Stable key for pairing live scores with stored overrides
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const currentPeriod: 'H1' | 'H2' = now.getMonth() < 6 ? 'H1' : 'H2'

  useEffect(() => {
    if (properties.length === 0) return

    async function loadData() {
      const [allScorecards, allMonthly] = await Promise.all([
        Promise.all(properties.map(p => api.scorecards.list(p.id).catch(() => [] as Scorecard[]))),
        Promise.all(properties.map(p => api.monthly.list(p.id).catch(() => []))),
      ])

      const map: Record<string, number> = {}
      const liveScorecards: Scorecard[] = []
      let totalAvgMonthlyIncome = 0
      let totalAvgMonthlyExpenses = 0
      let totalAvgMonthlyCashFlow = 0
      let totalPurchasePrice = 0
      let totalBaseValue = 0

      const missing = new Set<string>()

      properties.forEach((p, i) => {
        totalPurchasePrice += p.purchasePrice
        totalBaseValue += (p.estimatedCurrentValue ?? 0) > 0 ? p.estimatedCurrentValue : p.purchasePrice
        const metrics = calculateTrailing3MonthsMetrics(allMonthly[i])
        if (metrics.monthsWithData > 0) {
          map[p.id] = metrics.averages.monthlyCashFlow
          totalAvgMonthlyIncome += metrics.averages.monthlyIncome
          totalAvgMonthlyCashFlow += metrics.averages.monthlyCashFlow
          totalAvgMonthlyExpenses += metrics.averages.monthlyIncome - metrics.averages.monthlyCashFlow
          const live = computeLiveScorecard(metrics)
          const stored = allScorecards[i].find(s => s.year === currentYear && s.period === currentPeriod)
          liveScorecards.push(mergeLiveWithStored(live, p.id, currentYear, currentPeriod, stored))
        }
        const hasCurrentMonth = allMonthly[i].some(m => m.year === currentYear && m.month === currentMonth)
        if (!hasCurrentMonth) missing.add(p.id)
      })

      setCashFlowMap(map)
      setScorecards(liveScorecards)
      setEntryNeededIds(missing)
      setPortfolioStats({
        totalProperties: properties.length,
        totalUnits: properties.reduce((sum, p) => sum + p.units, 0),
        projectedAnnualIncome: totalAvgMonthlyIncome * 12,
        projectedAnnualExpenses: totalAvgMonthlyExpenses * 12,
        projectedAnnualCashFlow: totalAvgMonthlyCashFlow * 12,
        totalPurchasePrice,
        totalBaseValue,
      })
    }

    loadData()
  }, [properties]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <Header title="Portfolio Dashboard" subtitle="North Star Ventures" />
      <PageContainer>
        {propsLoading ? (
          <LoadingSpinner size="lg" className="mt-20" />
        ) : properties.length === 0 ? (
          <EmptyState
            icon="🏠"
            title="No properties yet"
            description="Add your first property to start tracking performance."
            action={
              <button
                onClick={() => navigate('/properties')}
                className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
              >
                Add First Property
              </button>
            }
          />
        ) : (
          <div className="space-y-8">
            {portfolioStats && (
              <>
                <PortfolioStats stats={portfolioStats} />
                <PortfolioROIBar
                  totalPurchasePrice={portfolioStats.totalPurchasePrice}
                  totalBaseValue={portfolioStats.totalBaseValue}
                  projectedAnnualCashFlow={portfolioStats.projectedAnnualCashFlow}
                />
              </>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Properties</h3>
                <PropertyGrid properties={properties} scorecards={scorecards} cashFlowMap={cashFlowMap} entryNeededIds={entryNeededIds} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Action Items</h3>
                <WatchlistPanel scorecards={scorecards} properties={properties} />
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
