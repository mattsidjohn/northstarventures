import { Property, Scorecard } from '@/types'
import PropertyCard from '@/components/dashboard/PropertyCard'

export interface PropertyGridProps {
  properties: Property[]
  scorecards?: Scorecard[]
  cashFlowMap?: Record<string, number>
  entryNeededIds?: Set<string>
}

export default function PropertyGrid({ properties, scorecards = [], cashFlowMap = {}, entryNeededIds }: PropertyGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {properties.map(property => (
        <PropertyCard
          key={property.id}
          property={property}
          scorecard={scorecards.find(s => s.propertyId === property.id)}
          monthlyCashFlow={cashFlowMap[property.id]}
          entryNeeded={entryNeededIds?.has(property.id)}
        />
      ))}
    </div>
  )
}
