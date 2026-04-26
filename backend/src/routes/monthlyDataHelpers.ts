import { MonthlyData } from '@northstar/shared-types'

export function rowToMonthlyData(row: Record<string, unknown>): MonthlyData {
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    year: row.year as number,
    month: row.month as number,
    income: row.income as number,
    expenses: row.expenses as number,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}
