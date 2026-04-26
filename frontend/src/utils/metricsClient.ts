import {
  MonthlyData,
  MonthlyMetrics,
  SemiAnnualMetrics,
  InvestmentMetrics,
  Property,
} from '@northstar/shared-types'

export function calculateMonthlyMetrics(data: MonthlyData): MonthlyMetrics {
  const { income, expenses } = data
  return { income, expenses, cashFlow: income - expenses }
}

export function calculateSemiAnnualMetrics(
  data: MonthlyData[],
  year: number,
  period: 'H1' | 'H2'
): SemiAnnualMetrics {
  const months = period === 'H1' ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12]
  const periodData = data.filter(d => d.year === year && months.includes(d.month))
  const monthsWithData = periodData.length
  const avgMonths = monthsWithData || 1

  const totals = periodData.reduce(
    (acc, d) => {
      acc.income += d.income
      acc.expenses += d.expenses
      acc.cashFlow += d.income - d.expenses
      return acc
    },
    { income: 0, expenses: 0, cashFlow: 0 }
  )

  return {
    period, year, monthsWithData, totals,
    averages: {
      monthlyIncome: totals.income / avgMonths,
      monthlyCashFlow: totals.cashFlow / avgMonths,
    },
  }
}

export function calculateTrailing3MonthsMetrics(data: MonthlyData[]): SemiAnnualMetrics {
  const sorted = [...data].sort((a, b) =>
    a.year !== b.year ? b.year - a.year : b.month - a.month
  )
  const trailing = sorted.slice(0, 3)
  const n = trailing.length

  if (n === 0) {
    const now = new Date()
    return {
      period: now.getMonth() < 6 ? 'H1' : 'H2',
      year: now.getFullYear(),
      monthsWithData: 0,
      totals: { income: 0, expenses: 0, cashFlow: 0 },
      averages: { monthlyIncome: 0, monthlyCashFlow: 0 },
    }
  }

  const totals = trailing.reduce(
    (acc, d) => {
      acc.income += d.income
      acc.expenses += d.expenses
      acc.cashFlow += d.income - d.expenses
      return acc
    },
    { income: 0, expenses: 0, cashFlow: 0 }
  )

  const latest = trailing[0]
  return {
    period: latest.month <= 6 ? 'H1' : 'H2',
    year: latest.year,
    monthsWithData: n,
    totals,
    averages: {
      monthlyIncome: totals.income / n,
      monthlyCashFlow: totals.cashFlow / n,
    },
  }
}

export function calculateInvestmentMetrics(property: Property, semiAnnual: SemiAnnualMetrics): InvestmentMetrics {
  const { purchasePrice, estimatedCurrentValue } = property
  const { totals } = semiAnnual

  const appreciationEstimate = estimatedCurrentValue - purchasePrice
  const annualizedCashFlow = totals.cashFlow * 2

  const capRate = estimatedCurrentValue > 0 ? (annualizedCashFlow / estimatedCurrentValue) * 100 : 0
  const purchaseCapRate = purchasePrice > 0 ? (annualizedCashFlow / purchasePrice) * 100 : 0
  const totalReturnEstimate = totals.cashFlow + appreciationEstimate / 2

  return { estimatedCurrentValue, purchasePrice, appreciationEstimate, capRate, purchaseCapRate, totalReturnEstimate, isAnnualized: true }
}
