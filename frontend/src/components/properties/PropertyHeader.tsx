import { Property } from '@northstar/shared-types'

export interface PropertyHeaderProps {
  property: Property
}

const TYPE_LABELS: Record<Property['propertyType'], string> = {
  'single-family': 'Single Family',
  'duplex': 'Duplex',
  'multi-unit': 'Multi-Unit',
  'commercial': 'Commercial',
  'mixed-use': 'Mixed Use',
}

export default function PropertyHeader({ property }: PropertyHeaderProps) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
      <div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Type</p>
        <p className="mt-0.5 font-medium">{TYPE_LABELS[property.propertyType]}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Units</p>
        <p className="mt-0.5 font-medium">{property.units}</p>
      </div>
      {property.sqft && (
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Sq Ft</p>
          <p className="mt-0.5 font-medium">{property.sqft.toLocaleString()}</p>
        </div>
      )}
      {property.acquisitionDate && (
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Acquired</p>
          <p className="mt-0.5 font-medium">{property.acquisitionDate}</p>
        </div>
      )}
    </div>
  )
}
