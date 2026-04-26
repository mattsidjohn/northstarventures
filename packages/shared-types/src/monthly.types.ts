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
