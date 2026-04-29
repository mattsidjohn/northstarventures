// ── property.types ──────────────────────────────────────────────────────────

export type PropertyType = 'single-family' | 'duplex' | 'multi-unit' | 'commercial' | 'mixed-use'

export interface Property {
  id: string
  name: string
  address: string
  propertyType: PropertyType
  units: number
  sqft?: number
  acquisitionDate?: string
  purchasePrice: number
  estimatedCurrentValue: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type CreatePropertyInput = Omit<Property, 'id' | 'createdAt' | 'updatedAt'>
export type UpdatePropertyInput = Partial<CreatePropertyInput>

export interface PropertySummary {
  id: string
  name: string
  address: string
  units: number
  propertyType: PropertyType
}

// ── monthly.types ────────────────────────────────────────────────────────────

export interface MonthlyData {
  id: string
  propertyId: string
  year: number
  month: number
  income: number    // total income collected
  expenses: number  // total expenses including bank payment
  notes?: string
  createdAt: string
  updatedAt: string
}

export type CreateMonthlyDataInput = Omit<MonthlyData, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateMonthlyDataInput = Partial<Omit<CreateMonthlyDataInput, 'propertyId' | 'year' | 'month'>>

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// ── metrics.types ────────────────────────────────────────────────────────────

export interface MonthlyMetrics {
  income: number
  expenses: number
  cashFlow: number   // income - expenses
}

export interface SemiAnnualTotals {
  income: number
  expenses: number
  cashFlow: number
}

export interface SemiAnnualAverages {
  monthlyIncome: number
  monthlyCashFlow: number
}

export interface SemiAnnualMetrics {
  period: 'H1' | 'H2'
  year: number
  monthsWithData: number
  totals: SemiAnnualTotals
  averages: SemiAnnualAverages
}

export interface InvestmentMetrics {
  estimatedCurrentValue: number
  purchasePrice: number
  appreciationEstimate: number
  capRate: number         // annualized cash flow / estimated value
  purchaseCapRate: number // annualized cash flow / purchase price
  totalReturnEstimate: number
  isAnnualized: boolean
}

export interface PortfolioSummary {
  totalProperties: number
  totalUnits: number
  period: 'H1' | 'H2'
  year: number
  totals: SemiAnnualTotals
  bestPropertyId?: string
  bestPropertyName?: string
  worstPropertyId?: string
  worstPropertyName?: string
  watchlistCount: number
  sellCount: number
}

// ── scorecard.types ──────────────────────────────────────────────────────────

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

// ── api.types ────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  success: true
}

export interface ApiError {
  success: false
  error: string
  details?: string
}

export type ApiResult<T> = ApiResponse<T> | ApiError

export interface BackupData {
  version: string
  exportedAt: string
  properties: unknown[]
  monthlyData: unknown[]
  scorecards: unknown[]
}

// ── deal.types ───────────────────────────────────────────────────────────────

export type FinancingType = 'interest-only' | '20-year-am' | '25-year-am' | '30-year-am' | 'cash'

export interface Deal {
  id: string
  name: string
  address: string
  propertyType: PropertyType
  units: number
  sqft?: number
  purchasePrice: number
  monthlyRent: number
  financingType: FinancingType
  interestRate: number
  loanAmount: number
  pmPercent: number
  vacancyPct: number
  maintenanceReservePct: number
  insurancePct: number
  taxPct: number
  notes?: string
  status: 'active' | 'converted'
  convertedPropertyId?: string
  createdAt: string
  updatedAt: string
}

export type CreateDealInput = Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateDealInput = Partial<Omit<CreateDealInput, 'name'>>
