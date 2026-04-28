import { Router, Request, Response } from 'express'
import { createUserClient } from '../lib/supabase'
import { Scorecard, UpdateScorecardInput } from '@northstar/shared-types'
import { calculateSemiAnnualMetrics } from '../services/metricsService'
import { buildScorecard } from '../services/scorecardService'
import { rowToMonthlyData } from './monthlyDataHelpers'

const router = Router({ mergeParams: true })

function rowToScorecard(row: Record<string, unknown>): Scorecard {
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    year: row.year as number,
    period: row.period as 'H1' | 'H2',
    // financial_factors is JSONB — Supabase returns it already parsed
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

router.get('/', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const { data, error } = await db
      .from('scorecards')
      .select('*')
      .eq('property_id', req.params.id)
      .order('year', { ascending: false })
      .order('period', { ascending: false })
    if (error) return res.status(500).json({ success: false, error: error.message })
    res.json({ success: true, data: (data ?? []).map(rowToScorecard) })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const { year, period } = req.body as { year: number; period: 'H1' | 'H2' }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ success: false, error: 'Invalid year' })
    }
    if (period !== 'H1' && period !== 'H2') {
      return res.status(400).json({ success: false, error: 'Invalid period — must be H1 or H2' })
    }

    // Verify property exists under this user
    const { data: property } = await db
      .from('properties')
      .select('id')
      .eq('id', req.params.id)
      .single()
    if (!property) return res.status(404).json({ success: false, error: 'Property not found' })

    // Fetch all monthly data and compute semi-annual metrics
    const { data: monthlyRows, error: mErr } = await db
      .from('monthly_data')
      .select('*')
      .eq('property_id', req.params.id)
    if (mErr) return res.status(500).json({ success: false, error: mErr.message })

    const monthlyData = (monthlyRows ?? []).map(rowToMonthlyData)
    const semiAnnual = calculateSemiAnnualMetrics(monthlyData, year, period)
    const scorecard = buildScorecard(req.params.id, year, period, semiAnnual)

    const { data, error } = await db
      .from('scorecards')
      .upsert(
        {
          property_id: req.params.id,
          user_id: req.userId,
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

    if (error) return res.status(500).json({ success: false, error: error.message })
    res.status(201).json({ success: true, data: rowToScorecard(data) })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.put('/:scorecardId', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const update = req.body as UpdateScorecardInput

    const { data: existing } = await db
      .from('scorecards')
      .select('id')
      .eq('id', req.params.scorecardId)
      .eq('property_id', req.params.id)
      .single()
    if (!existing) return res.status(404).json({ success: false, error: 'Scorecard not found' })

    const { data, error } = await db
      .from('scorecards')
      .update({
        user_decision_override: update.userDecisionOverride ?? null,
        decision_notes: update.decisionNotes ?? null,
        action_plan: update.actionPlan ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.scorecardId)
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: error.message })
    res.json({ success: true, data: rowToScorecard(data) })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
