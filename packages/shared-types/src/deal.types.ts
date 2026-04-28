import { PropertyType } from './property.types'

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
