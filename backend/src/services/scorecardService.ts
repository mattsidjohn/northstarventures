import {
  CategoryScore,
  DecisionRating,
  Scorecard,
  SemiAnnualMetrics,
} from '@northstar/shared-types'

// Score based on cash flow margin (cashFlow / income).
export function scoreFinancial(metrics: SemiAnnualMetrics): CategoryScore {
  const { totals } = metrics
  const factors: string[] = []

  const margin = totals.income > 0 ? (totals.cashFlow / totals.income) * 100 : -100
  const avgMonthlyCashFlow = metrics.averages.monthlyCashFlow

  let score: number
  if (margin >= 20) score = 5
  else if (margin >= 10) score = 4
  else if (margin >= 5) score = 3
  else score = 2

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

export function recommendDecision(
  metrics: SemiAnnualMetrics,
  overall: number
): { decision: DecisionRating; reasons: string[] } {
  const margin = metrics.totals.income > 0
    ? (metrics.totals.cashFlow / metrics.totals.income) * 100
    : -100
  const avgMonthlyCashFlow = metrics.averages.monthlyCashFlow

  if (overall >= 5) {
    return {
      decision: 'Strong Hold',
      reasons: [
        `Excellent cash flow margin (${margin.toFixed(1)}% of rent)`,
        `Avg monthly cash flow: $${avgMonthlyCashFlow.toFixed(0)}`,
        'Core portfolio asset — maintain and grow',
      ],
    }
  }

  if (overall >= 4) {
    return {
      decision: 'Hold',
      reasons: [
        `Good cash flow margin (${margin.toFixed(1)}% of rent)`,
        `Avg monthly cash flow: $${avgMonthlyCashFlow.toFixed(0)}`,
        'Performing well — continue current strategy',
      ],
    }
  }

  if (overall >= 3) {
    return {
      decision: 'Monitor',
      reasons: [
        `Thin cash flow margin (${margin.toFixed(1)}% of rent)`,
        `Avg monthly cash flow: $${avgMonthlyCashFlow.toFixed(0)}`,
        'Watch closely — consider rent increases or expense reductions',
      ],
    }
  }

  return {
    decision: 'Sell',
    reasons: [
      `Cash flow margin of ${margin.toFixed(1)}% is below acceptable threshold`,
      `Avg monthly cash flow: $${avgMonthlyCashFlow.toFixed(0)}`,
      'Capital may be better deployed elsewhere',
    ],
  }
}

// Returns scorecard data without an id — the DB generates it on upsert.
export function buildScorecard(
  propertyId: string,
  year: number,
  period: 'H1' | 'H2',
  metrics: SemiAnnualMetrics,
): Omit<Scorecard, 'id'> {
  const financial = scoreFinancial(metrics)
  const overallScore = financial.score
  const interpretation = interpretScore(overallScore)
  const { decision, reasons } = recommendDecision(metrics, overallScore)

  const now = new Date().toISOString()
  return {
    propertyId,
    year,
    period,
    financial,
    overallScore,
    interpretation,
    recommendedDecision: decision,
    decisionReasons: reasons,
    createdAt: now,
    updatedAt: now,
  }
}
