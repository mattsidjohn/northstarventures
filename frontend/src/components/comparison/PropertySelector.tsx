import { Property } from '@northstar/shared-types'

export interface PropertySelectorProps {
  properties: Property[]
  selected: string[]
  onChange: (ids: string[]) => void
}

export default function PropertySelector({ properties, selected, onChange }: PropertySelectorProps) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select Properties</p>
      <div className="flex flex-wrap gap-2">
        {properties.map(p => (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              selected.includes(p.id)
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-300'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  )
}
