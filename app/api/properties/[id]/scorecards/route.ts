import { NextRequest, NextResponse } from 'next/server'
import { getEffectiveUser } from '@/lib/supabase/admin-client'
import { Scorecard } from '@/types'
import { calculateSemiAnnualMetrics } from '@/lib/services/metricsService'
import { buildScorecard } from '@/lib/services/scorecardService'

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

function rowToScorecard(row: Record<string, unknown>): Scorecard {
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    year: row.year as number,
    period: row.period as 'H1' | 'H2',
    financial: {
      score: row.financial_score as number,
      factors: row.financial_factors as string[],
    },
    overallScore: row.overall_score as number,
    interpretation: row.interpretation as Scorecard['interpretation'],
    recommendedDecision: row.recommended_decision as Scorecard['recommendedDecision'],
    decisionReasons: row.decision_reasons as string[],
    userDecisionOverride: row.user_decision_override as Scorecard['userDecisionOverride'],
    decisionNotes: row.decision_notes as string | undefined,
    actionPlan: row.action_plan as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getEffectiveUser(request)
    if (!ctx) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { supabase, userId } = ctx
    const { data, error } = await supabase
      .from('scorecards')
      .select('*')
      .eq('property_id', id)
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('period', { ascending: false })
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: (data ?? []).map(rowToScorecard) })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getEffectiveUser(request)
    if (!ctx) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { supabase, userId } = ctx
    const { year, period } = await request.json() as { year: number; period: 'H1' | 'H2' }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ success: false, error: 'Invalid year' }, { status: 400 })
    }
    if (period !== 'H1' && period !== 'H2') {
      return NextResponse.json({ success: false, error: 'Invalid period — must be H1 or H2' }, { status: 400 })
    }
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (!property) return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    const { data: monthlyRows, error: mErr } = await supabase
      .from('monthly_data')
      .select('*')
      .eq('property_id', id)
      .eq('user_id', userId)
    if (mErr) return NextResponse.json({ success: false, error: mErr.message }, { status: 500 })
    const monthlyData = (monthlyRows ?? []).map(rowToMonthlyData)
    const semiAnnual = calculateSemiAnnualMetrics(monthlyData, year, period)
    const scorecard = buildScorecard(id, year, period, semiAnnual)
    const { data, error } = await supabase
      .from('scorecards')
      .upsert(
        {
          property_id: id,
          user_id: userId,
          year,
          period,
          financial_score: scorecard.financial.score,
          financial_factors: scorecard.financial.factors,
          operational_score: 0,
          operational_factors: [],
          investment_score: 0,
          investment_factors: [],
          strategic_score: 3,
          strategic_factors: [],
          overall_score: scorecard.overallScore,
          interpretation: scorecard.interpretation,
          recommended_decision: scorecard.recommendedDecision,
          decision_reasons: scorecard.decisionReasons,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'property_id,year,period' }
      )
      .select()
      .single()
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: rowToScorecard(data) }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
