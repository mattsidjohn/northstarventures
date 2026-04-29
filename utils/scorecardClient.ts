import { CategoryScore, DecisionRating, Scorecard, SemiAnnualMetrics } from '@/types'

export interface LiveScorecard {
  financial: CategoryScore
  overallScore: number
  interpretation: DecisionRating
  recommendedDecision: DecisionRating
  decisionReasons: string[]
}

export function scoreFinancial(metrics: SemiAnnualMetrics): CategoryScore {
  const { totals } = metrics
  const margin = totals.income > 0 ? (totals.cashFlow / totals.income) * 100 : -100
  const avgMonthlyCashFlow = metrics.averages.monthlyCashFlow

  let score: number
  if (margin >= 20) score = 5
  else if (margin >= 10) score = 4
  else if (margin >= 5) score = 3
  else score = 2

  const factors: string[] = []
  if (score === 5) factors.push(`Excellent cash flow margin (${margin.toFixed(1)}% of rent)`)
  else if (score === 4) factors.push(`Good cash flow margin (${margin.toFixed(1)}% of rent)`)
  else if (score === 3) factors.push(`Below 10% margin — monitor closely (${margin.toFixed(1)}% of rent)`)
  else factors.push(`Below 5% margin — consider selling (${margin.toFixed(1)}% of rent)`)
  factors.push(`Avg monthly cash flow: $${avgMonthlyCashFlow.toFixed(0)}`)

  return { score, factors }
}

export function interpretScore(overall: number): DecisionRating {
  if (overall >= 5) return 'Strong Hold'
  if (overall >= 4) return 'Hold'
  if (overall >= 3) return 'Monitor'
  return 'Sell'
}

export function computeLiveScorecard(metrics: SemiAnnualMetrics): LiveScorecard {
  const financial = scoreFinancial(metrics)
  const overallScore = financial.score
  const interpretation = interpretScore(overallScore)

  let decision: DecisionRating
  let reasons: string[]
  const margin = metrics.totals.income > 0
    ? (metrics.totals.cashFlow / metrics.totals.income) * 100 : -100
  const avg = metrics.averages.monthlyCashFlow

  if (overallScore >= 5) {
    decision = 'Strong Hold'
    reasons = [`Excellent cash flow margin (${margin.toFixed(1)}% of rent)`, `Avg monthly cash flow: $${avg.toFixed(0)}`, 'Core portfolio asset — maintain and grow']
  } else if (overallScore >= 4) {
    decision = 'Hold'
    reasons = [`Good cash flow margin (${margin.toFixed(1)}% of rent)`, `Avg monthly cash flow: $${avg.toFixed(0)}`, 'Performing well — continue current strategy']
  } else if (overallScore >= 3) {
    decision = 'Monitor'
    reasons = [`Thin cash flow margin (${margin.toFixed(1)}% of rent)`, `Avg monthly cash flow: $${avg.toFixed(0)}`, 'Watch closely — consider rent increases or expense reductions']
  } else {
    decision = 'Sell'
    reasons = [`Cash flow margin of ${margin.toFixed(1)}% is below acceptable threshold`, `Avg monthly cash flow: $${avg.toFixed(0)}`, 'Capital may be better deployed elsewhere']
  }

  return { financial, overallScore, interpretation, recommendedDecision: decision, decisionReasons: reasons }
}

// Merge a live scorecard with stored override data into a full Scorecard object.
export function mergeLiveWithStored(
  live: LiveScorecard,
  propertyId: string,
  year: number,
  period: 'H1' | 'H2',
  stored?: Scorecard | null
): Scorecard {
  return {
    id: stored?.id ?? '',
    propertyId,
    year,
    period,
    financial: live.financial,
    overallScore: live.overallScore,
    interpretation: live.interpretation,
    recommendedDecision: live.recommendedDecision,
    decisionReasons: live.decisionReasons,
    userDecisionOverride: stored?.userDecisionOverride,
    decisionNotes: stored?.decisionNotes,
    actionPlan: stored?.actionPlan,
    createdAt: stored?.createdAt ?? '',
    updatedAt: stored?.updatedAt ?? '',
  }
}
