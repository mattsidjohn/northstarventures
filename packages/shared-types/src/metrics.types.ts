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
