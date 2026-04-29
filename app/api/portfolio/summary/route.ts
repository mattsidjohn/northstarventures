import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PortfolioSummary, SemiAnnualTotals } from '@/types'
import { calculateSemiAnnualMetrics } from '@/lib/services/metricsService'

function rowToProperty(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    propertyType: row.property_type as string,
    units: row.units as number,
    sqft: row.sqft as number | undefined,
    acquisitionDate: row.acquisition_date as string | undefined,
    purchasePrice: row.purchase_price as number,
    estimatedCurrentValue: row.estimated_current_value as number,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function rowToMonthlyData(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    year: row.year as number,
    month: row.month as number,
    income: row.income as number,
    expenses: row.expenses as number,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const rawYear = parseInt(request.nextUrl.searchParams.get('year') ?? '')
    const year = Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100
      ? rawYear
      : new Date().getFullYear()
    const rawPeriod = request.nextUrl.searchParams.get('period')
    const period: 'H1' | 'H2' = (rawPeriod === 'H1' || rawPeriod === 'H2')
      ? rawPeriod
      : (new Date().getMonth() < 6 ? 'H1' : 'H2')

    const [propResult, monthlyResult, scorecardResult] = await Promise.all([
      supabase.from('properties').select('*'),
      supabase.from('monthly_data').select('*'),
      supabase.from('scorecards').select('*').eq('year', year).eq('period', period),
    ])

    if (propResult.error) return NextResponse.json({ success: false, error: propResult.error.message }, { status: 500 })

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

    return NextResponse.json({ success: true, data: summary })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
