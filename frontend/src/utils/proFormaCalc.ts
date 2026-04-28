import { PropertyType, FinancingType } from '@northstar/shared-types'

export type { FinancingType }

export interface ProFormaInputs {
  purchasePrice: number
  monthlyRent: number
  financingType: FinancingType
  interestRate: number   // annual %, e.g. 7.5
  loanAmount: number     // defaults to purchasePrice * 0.80
  pmPercent: number      // e.g. 10 for 10%
  vacancyPct?: number            // default 5
  maintenanceReservePct?: number // default 10
  insurancePct?: number          // default 0.5  (annual % of purchase price)
  taxPct?: number                // default 1.2  (annual % of purchase price)
}

export interface ProFormaLines {
  grossRent: number
  vacancy: number
  effectiveIncome: number
  pmFee: number
  insurance: number
  taxes: number
  operatingExpenses: number
  noi: number
  debtService: number
  cashFlow: number
  monthlyPrincipal: number    // first-month principal portion of debt service (0 for IO/cash)
  actualCashFlow: number      // cashFlow + monthlyPrincipal
  maintenanceReserve: number  // advisory — not deducted from cash flow
}

export type AcquisitionDecision =
  | 'Strong Buy'
  | 'Buy'
  | 'Borderline'
  | 'Pass'
  | 'Negative Cash Flow'

export interface ProFormaResult {
  lines: ProFormaLines
  annualNOI: number
  capRate: number
  cashInvested: number
  cashOnCash: number
  cashFlowMargin: number
  score: 2 | 3 | 4 | 5
  decision: AcquisitionDecision
}

export interface ProFormaMeta {
  name: string
  address: string
  propertyType: PropertyType
  units: number
  sqft?: number
}

const AM_TERMS: Partial<Record<FinancingType, number>> = {
  '20-year-am': 240,
  '25-year-am': 300,
  '30-year-am': 360,
}

function monthlyDebtService(loanAmount: number, financingType: FinancingType, interestRate: number): number {
  if (financingType === 'cash') return 0
  const r = interestRate / 100 / 12
  if (financingType === 'interest-only') return loanAmount * r
  const n = AM_TERMS[financingType]!
  if (r === 0) return loanAmount / n
  return loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

export function computeProForma(inputs: ProFormaInputs): ProFormaResult | null {
  if (inputs.purchasePrice <= 0 || inputs.monthlyRent <= 0) return null

  const { purchasePrice, monthlyRent, financingType, interestRate, pmPercent } = inputs
  const vacancyPct = inputs.vacancyPct ?? 5
  const maintenanceReservePct = inputs.maintenanceReservePct ?? 10
  const insurancePct = inputs.insurancePct ?? 0.5
  const taxPct = inputs.taxPct ?? 1.2
  const loanAmount = financingType === 'cash' ? 0 : inputs.loanAmount

  // Income
  const grossRent = monthlyRent
  const vacancy = grossRent * (vacancyPct / 100)
  const effectiveIncome = grossRent - vacancy

  // Operating expenses (maintenance reserve excluded — advisory only)
  const pmFee = effectiveIncome * (pmPercent / 100)
  const insurance = (purchasePrice * (insurancePct / 100)) / 12
  const taxes = (purchasePrice * (taxPct / 100)) / 12
  const operatingExpenses = pmFee + insurance + taxes

  // NOI and cash flow
  const noi = effectiveIncome - operatingExpenses
  const debtService = monthlyDebtService(loanAmount, financingType, interestRate)
  const cashFlow = noi - debtService

  // Principal portion of month-1 debt service
  const monthlyRate = interestRate / 100 / 12
  const monthlyPrincipal =
    financingType === 'cash' || financingType === 'interest-only'
      ? 0
      : Math.max(0, debtService - loanAmount * monthlyRate)
  const actualCashFlow = cashFlow + monthlyPrincipal

  // Maintenance reserve — shown as advisory
  const maintenanceReserve = grossRent * (maintenanceReservePct / 100)

  // Investment metrics
  const annualNOI = noi * 12
  const capRate = (annualNOI / purchasePrice) * 100
  const closingCosts = purchasePrice * 0.025
  const cashInvested = financingType === 'cash'
    ? purchasePrice + closingCosts
    : (purchasePrice - loanAmount) + closingCosts
  const cashOnCash = ((cashFlow * 12) / cashInvested) * 100
  // For amortizing loans, margin includes principal paydown (actual economic return)
  const cashFlowMargin = (actualCashFlow / effectiveIncome) * 100

  let score: 2 | 3 | 4 | 5
  let decision: AcquisitionDecision
  if (cashFlow < 0) {
    score = 2
    decision = 'Negative Cash Flow'
  } else if (cashFlowMargin >= 20) {
    score = 5
    decision = 'Strong Buy'
  } else if (cashFlowMargin >= 10) {
    score = 4
    decision = 'Buy'
  } else if (cashFlowMargin >= 5) {
    score = 3
    decision = 'Borderline'
  } else {
    score = 2
    decision = 'Pass'
  }

  return {
    lines: { grossRent, vacancy, effectiveIncome, pmFee, insurance, taxes, operatingExpenses, noi, debtService, cashFlow, monthlyPrincipal, actualCashFlow, maintenanceReserve },
    annualNOI, capRate, cashInvested, cashOnCash, cashFlowMargin, score, decision,
  }
}

// Binary search for the min monthly rent that achieves a target cash-flow margin at the current purchase price.
// Returns the lowest rent in $10 increments where computeProForma confirms the target.
export function solveMinMonthlyRent(
  inputs: ProFormaInputs,
  targetMarginPct: number,
): number | null {
  if (inputs.purchasePrice <= 0) return null

  const step = 10
  const minRent = step
  const maxRent = Math.max(10000, inputs.purchasePrice * 0.05)

  const testAt = (rent: number): boolean => {
    const r = computeProForma({ ...inputs, monthlyRent: rent })
    return r !== null && r.cashFlowMargin >= targetMarginPct
  }

  if (!testAt(maxRent)) return null

  let lo = minRent, hi = maxRent
  while (hi - lo > step) {
    const mid = Math.round((lo + hi) / (2 * step)) * step
    if (testAt(mid)) hi = mid
    else lo = mid
  }

  return testAt(lo) ? lo : hi
}

// Binary search for the max purchase price that achieves a target cash-flow margin.
// scaleLoan=true  → loan is always 80% of the tested price (matches auto-LTV behaviour)
// scaleLoan=false → loan stays fixed at inputs.loanAmount (matches loanTouched=true behaviour)
// Returns the highest price in $500 increments where computeProForma itself confirms the target.
export function solveMaxPurchasePrice(
  inputs: ProFormaInputs,
  targetMarginPct: number,  // same scale as cashFlowMargin: 20 for Score 5, 10 for Score 4
  ltvPct = 80               // loan-to-value % to apply when scaling the loan with the test price
): number | null {
  if (inputs.monthlyRent <= 0) return null

  const testAt = (price: number): boolean => {
    const loanAmount = inputs.financingType === 'cash' ? 0 : price * ltvPct / 100
    const r = computeProForma({ ...inputs, purchasePrice: price, loanAmount })
    return r !== null && r.cashFlowMargin >= targetMarginPct
  }

  const step = 500
  const minPrice = step
  const maxPrice = inputs.monthlyRent * 600

  if (!testAt(minPrice)) return null
  if (testAt(maxPrice)) return maxPrice

  let lo = minPrice, hi = maxPrice
  while (hi - lo > step) {
    // Keep mid on a step boundary
    const mid = Math.round((lo + hi) / (2 * step)) * step
    if (testAt(mid)) lo = mid
    else hi = mid
  }

  return testAt(lo) ? lo : null
}

export interface YearProjection {
  year: number
  propertyValue: number
  loanBalance: number
  equity: number
  annualCashFlow: number
  principalPaydown: number
  interestPaid: number
  appreciationGain: number
  totalReturn: number
  cumulativeReturn: number
  cashInvested: number
  roi: number
}

export function computeProjection(
  inputs: ProFormaInputs,
  result: ProFormaResult
): YearProjection[] {
  const { purchasePrice, financingType, interestRate, loanAmount } = inputs
  const r = interestRate / 100 / 12
  const M = result.lines.debtService
  const annualCashFlow = result.lines.cashFlow * 12
  const { cashInvested } = result

  function balanceAfter(months: number): number {
    if (financingType === 'cash') return 0
    if (financingType === 'interest-only') return loanAmount
    if (r === 0) return Math.max(0, loanAmount - M * months)
    return loanAmount * Math.pow(1 + r, months) - M * ((Math.pow(1 + r, months) - 1) / r)
  }

  const projections: YearProjection[] = []
  let cumulativeReturn = 0

  for (let year = 1; year <= 20; year++) {
    const propertyValue = purchasePrice * Math.pow(1.02, year)
    const appreciationGain = purchasePrice * Math.pow(1.02, year - 1) * 0.02
    const balanceStart = balanceAfter((year - 1) * 12)
    const balanceEnd = Math.max(0, balanceAfter(year * 12))
    const principalPaydown = Math.max(0, balanceStart - balanceEnd)
    const annualDebtService = M * 12
    const interestPaid = annualDebtService - principalPaydown
    const equity = propertyValue - balanceEnd
    const totalReturn = annualCashFlow + principalPaydown + appreciationGain
    cumulativeReturn += totalReturn

    projections.push({
      year, propertyValue, loanBalance: balanceEnd, equity,
      annualCashFlow, principalPaydown, interestPaid, appreciationGain,
      totalReturn, cumulativeReturn, cashInvested,
      roi: cashInvested > 0 ? (cumulativeReturn / cashInvested) * 100 : 0,
    })
  }

  return projections
}
