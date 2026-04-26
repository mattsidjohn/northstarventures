import { useState, useEffect } from 'react'
import { Scorecard } from '@northstar/shared-types'
import Header from '../components/layout/Header'
import PageContainer from '../components/layout/PageContainer'
import PeriodSelector from '../components/scorecard/PeriodSelector'
import PropertySelector from '../components/comparison/PropertySelector'
import MetricSelector, { ComparisonMetric } from '../components/comparison/MetricSelector'
import ComparisonTable, { ComparisonRow } from '../components/comparison/ComparisonTable'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useProperties } from '../hooks/useProperties'
import { useLocalPrefs } from '../hooks/useLocalPrefs'
import { api } from '../api/client'
import { calculateSemiAnnualMetrics, calculateInvestmentMetrics } from '../utils/metricsClient'

export default function Comparison() {
  const { properties, loading } = useProperties()
  const { prefs, setPrefs } = useLocalPrefs()
  const [selected, setSelected] = useState<string[]>([])
  const [metric, setMetric] = useState<ComparisonMetric>('overallScore')
  const [rows, setRows] = useState<ComparisonRow[]>([])
  const [buildingRows, setBuildingRows] = useState(false)

  useEffect(() => {
    if (selected.length === 0) { setRows([]); return }

    async function buildRows() {
      setBuildingRows(true)
      const built = await Promise.all(
        selected.map(async id => {
          const property = properties.find(p => p.id === id)
          if (!property) return null

          const [monthlyData, scorecards] = await Promise.all([
            api.monthly.list(id).catch(() => []),
            api.scorecards.list(id).catch(() => [] as Scorecard[]),
          ])

          const semiAnnual = calculateSemiAnnualMetrics(monthlyData, prefs.selectedYear, prefs.selectedPeriod)
          const inv = calculateInvestmentMetrics(property, semiAnnual)
          const scorecard = scorecards.find(s => s.year === prefs.selectedYear && s.period === prefs.selectedPeriod)
          const expenseRatio = semiAnnual.totals.income > 0 ? semiAnnual.totals.expenses / semiAnnual.totals.income : 0

          return {
            property,
            scorecard,
            cashFlow: semiAnnual.totals.cashFlow,
            expenseRatio,
            capRate: inv.capRate,
          } as ComparisonRow
        })
      )
      setRows(built.filter((r): r is ComparisonRow => r !== null))
      setBuildingRows(false)
    }

    buildRows()
  }, [selected, prefs.selectedYear, prefs.selectedPeriod, properties])

  return (
    <div>
      <Header
        title="Property Comparison"
        subtitle="Compare metrics across your portfolio"
        actions={
          <PeriodSelector
            year={prefs.selectedYear}
            period={prefs.selectedPeriod}
            onYearChange={y => setPrefs({ selectedYear: y })}
            onPeriodChange={p => setPrefs({ selectedPeriod: p })}
          />
        }
      />
      <PageContainer>
        {loading ? (
          <LoadingSpinner size="lg" className="mt-20" />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-6 items-start">
              <PropertySelector
                properties={properties}
                selected={selected}
                onChange={setSelected}
              />
              <MetricSelector value={metric} onChange={setMetric} />
            </div>

            {buildingRows ? (
              <LoadingSpinner size="md" className="mt-10" />
            ) : (
              <ComparisonTable rows={rows} metric={metric} />
            )}
          </div>
        )}
      </PageContainer>
    </div>
  )
}
