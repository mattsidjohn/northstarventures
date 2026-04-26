import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'
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
    financial: { score: row.financial_score as number, factors: JSON.parse(row.financial_factors as string) },
    overallScore: row.financial_score as number,
    interpretation: row.interpretation as Scorecard['interpretation'],
    recommendedDecision: row.recommended_decision as Scorecard['recommendedDecision'],
    decisionReasons: JSON.parse(row.decision_reasons as string),
    userDecisionOverride: row.user_decision_override as Scorecard['userDecisionOverride'],
    decisionNotes: row.decision_notes as string | undefined,
    actionPlan: row.action_plan as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM scorecards WHERE property_id = ? ORDER BY year DESC, period DESC')
    .all(req.params.id) as Record<string, unknown>[]
  res.json({ success: true, data: rows.map(rowToScorecard) })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const { year, period } = req.body as { year: number; period: 'H1' | 'H2' }

  const propertyExists = db.prepare('SELECT id FROM properties WHERE id = ?').get(req.params.id)
  if (!propertyExists) return res.status(404).json({ success: false, error: 'Property not found' })

  const monthlyRows = db
    .prepare('SELECT * FROM monthly_data WHERE property_id = ?')
    .all(req.params.id) as Record<string, unknown>[]

  const monthlyData = monthlyRows.map(rowToMonthlyData)
  const semiAnnual = calculateSemiAnnualMetrics(monthlyData, year, period)

  const existing = db
    .prepare('SELECT id FROM scorecards WHERE property_id = ? AND year = ? AND period = ?')
    .get(req.params.id, year, period) as { id: string } | undefined

  const scorecard = buildScorecard(req.params.id, year, period, semiAnnual, existing?.id)

  db.prepare(`
    INSERT INTO scorecards (
      id, property_id, year, period,
      financial_score, financial_factors,
      operational_score, operational_factors,
      investment_score, investment_factors,
      strategic_score, strategic_factors,
      overall_score, interpretation,
      recommended_decision, decision_reasons,
      user_decision_override, decision_notes, action_plan,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(property_id, year, period) DO UPDATE SET
      financial_score = excluded.financial_score,
      financial_factors = excluded.financial_factors,
      overall_score = excluded.overall_score,
      interpretation = excluded.interpretation,
      recommended_decision = excluded.recommended_decision,
      decision_reasons = excluded.decision_reasons,
      updated_at = excluded.updated_at
  `).run(
    scorecard.id, req.params.id, year, period,
    scorecard.financial.score, JSON.stringify(scorecard.financial.factors),
    0, '[]', 0, '[]', 0, '[]',
    scorecard.overallScore, scorecard.interpretation,
    scorecard.recommendedDecision, JSON.stringify(scorecard.decisionReasons),
    null, null, null,
    scorecard.createdAt, scorecard.updatedAt
  )

  const saved = db.prepare('SELECT * FROM scorecards WHERE id = ?').get(scorecard.id) as Record<string, unknown>
  res.status(201).json({ success: true, data: rowToScorecard(saved) })
})

router.put('/:scorecardId', (req: Request, res: Response) => {
  const db = getDb()
  const update = req.body as UpdateScorecardInput
  const now = new Date().toISOString()

  const existing = db
    .prepare('SELECT id FROM scorecards WHERE id = ? AND property_id = ?')
    .get(req.params.scorecardId, req.params.id)
  if (!existing) return res.status(404).json({ success: false, error: 'Scorecard not found' })

  db.prepare(`
    UPDATE scorecards SET
      user_decision_override = COALESCE(?, user_decision_override),
      decision_notes = COALESCE(?, decision_notes),
      action_plan = COALESCE(?, action_plan),
      updated_at = ?
    WHERE id = ?
  `).run(
    update.userDecisionOverride ?? null,
    update.decisionNotes ?? null,
    update.actionPlan ?? null,
    now, req.params.scorecardId
  )

  const saved = db.prepare('SELECT * FROM scorecards WHERE id = ?').get(req.params.scorecardId) as Record<string, unknown>
  res.json({ success: true, data: rowToScorecard(saved) })
})

export default router
