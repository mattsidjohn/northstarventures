import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Scorecard, UpdateScorecardInput } from '@/types'

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; scorecardId: string }> }) {
  try {
    const { id, scorecardId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const update = await request.json() as UpdateScorecardInput
    const { data: existing } = await supabase
      .from('scorecards')
      .select('id')
      .eq('id', scorecardId)
      .eq('property_id', id)
      .single()
    if (!existing) return NextResponse.json({ success: false, error: 'Scorecard not found' }, { status: 404 })
    const { data, error } = await supabase
      .from('scorecards')
      .update({
        user_decision_override: update.userDecisionOverride ?? null,
        decision_notes: update.decisionNotes ?? null,
        action_plan: update.actionPlan ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scorecardId)
      .select()
      .single()
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: rowToScorecard(data) })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
