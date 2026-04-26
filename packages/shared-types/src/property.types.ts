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
