export type DecisionRating = 'Strong Hold' | 'Hold' | 'Monitor' | 'Sell'

export type ScoreInterpretation = 'Strong Hold' | 'Hold' | 'Monitor' | 'Sell'

export interface CategoryScore {
  score: number
  factors: string[]
}

export interface Scorecard {
  id: string
  propertyId: string
  year: number
  period: 'H1' | 'H2'
  financial: CategoryScore
  overallScore: number
  interpretation: ScoreInterpretation
  recommendedDecision: DecisionRating
  decisionReasons: string[]
  userDecisionOverride?: DecisionRating
  decisionNotes?: string
  actionPlan?: string
  createdAt: string
  updatedAt: string
}

export type CreateScorecardInput = {
  propertyId: string
  year: number
  period: 'H1' | 'H2'
}

export type UpdateScorecardInput = {
  userDecisionOverride?: DecisionRating
  decisionNotes?: string
  actionPlan?: string
}

export const DECISION_COLORS: Record<DecisionRating, string> = {
  'Strong Hold': 'green',
  'Hold': 'emerald',
  'Monitor': 'yellow',
  'Sell': 'red',
}

export const SCORE_THRESHOLDS = {
  STRONG_HOLD: 5,
  HOLD: 4,
  MONITOR: 3,
  SELL: 2,
} as const
