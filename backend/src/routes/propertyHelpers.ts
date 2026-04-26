import { Property } from '@northstar/shared-types'

export function rowToProperty(row: Record<string, unknown>): Property {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    propertyType: row.property_type as Property['propertyType'],
    units: row.units as number,
    sqft: row.sqft as number | undefined,
    acquisitionDate: row.acquisition_date as string | undefined,
    purchasePrice: row.purchase_price as number,
    estimatedCurrentValue: row.estimated_current_value as number,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}
