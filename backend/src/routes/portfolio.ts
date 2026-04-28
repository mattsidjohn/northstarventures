import { Router, Request, Response } from 'express'
import { createUserClient } from '../lib/supabase'
import { PortfolioSummary, SemiAnnualTotals } from '@northstar/shared-types'
import { rowToProperty } from './propertyHelpers'
import { rowToMonthlyData } from './monthlyDataHelpers'
import { calculateSemiAnnualMetrics } from '../services/metricsService'

const router = Router()

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)

    const rawYear = parseInt(req.query.year as string)
    const year = Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100
      ? rawYear
      : new Date().getFullYear()
    const rawPeriod = req.query.period as string
    const period: 'H1' | 'H2' = (rawPeriod === 'H1' || rawPeriod === 'H2')
      ? rawPeriod
      : (new Date().getMonth() < 6 ? 'H1' : 'H2')

    const [propResult, monthlyResult, scorecardResult] = await Promise.all([
      db.from('properties').select('*'),
      db.from('monthly_data').select('*'),
      db.from('scorecards').select('*').eq('year', year).eq('period', period),
    ])

    if (propResult.error) return res.status(500).json({ success: false, error: propResult.error.message })

    const properties = (propResult.data ?? []).map(rowToProperty)
    const monthly = (monthlyResult.data ?? []).map(rowToMonthlyData)
    const allScorecards = scorecardResult.data ?? []

    const totalUnits = properties.reduce((sum, p) => sum + p.units, 0)
    const portfolioTotals: SemiAnnualTotals = { income: 0, expenses: 0, cashFlow: 0 }

    let bestScore = -1
    let worstScore = 999
    let bestPropertyId: string | undefined
    let bestPropertyName: string | undefined
    let worstPropertyId: string | undefined
    let worstPropertyName: string | undefined

    for (const prop of properties) {
      const propMonthly = monthly.filter(m => m.propertyId === prop.id)
      const metrics = calculateSemiAnnualMetrics(propMonthly, year, period)

      portfolioTotals.income   += metrics.totals.income
      portfolioTotals.expenses += metrics.totals.expenses
      portfolioTotals.cashFlow += metrics.totals.cashFlow

      const scorecard = allScorecards.find(s => s.property_id === prop.id)
      if (scorecard) {
        const score = scorecard.overall_score as number
        if (score > bestScore) { bestScore = score; bestPropertyId = prop.id; bestPropertyName = prop.name }
        if (score < worstScore) { worstScore = score; worstPropertyId = prop.id; worstPropertyName = prop.name }
      }
    }

    const watchlistCount = allScorecards.filter(
      s => (s.user_decision_override ?? s.recommended_decision) === 'Monitor'
    ).length
    const sellCount = allScorecards.filter(
      s => (s.user_decision_override ?? s.recommended_decision) === 'Sell'
    ).length

    const summary: PortfolioSummary = {
      totalProperties: properties.length,
      totalUnits,
      period,
      year,
      totals: portfolioTotals,
      bestPropertyId,
      bestPropertyName,
      worstPropertyId,
      worstPropertyName,
      watchlistCount,
      sellCount,
    }

    res.json({ success: true, data: summary })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
