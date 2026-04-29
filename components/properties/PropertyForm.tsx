'use client'

import { useState } from 'react'
import { CreatePropertyInput, PropertyType } from '@/types'
import FormField from '@/components/ui/FormField'
import CurrencyInput from '@/components/ui/CurrencyInput'

export interface PropertyFormProps {
  initial?: Partial<CreatePropertyInput>
  onSubmit: (input: CreatePropertyInput) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'single-family', label: 'Single Family' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'multi-unit', label: 'Multi-Unit' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed-use', label: 'Mixed Use' },
]

export default function PropertyForm({ initial, onSubmit, onCancel, loading }: PropertyFormProps) {
  const [form, setForm] = useState<CreatePropertyInput>({
    name: initial?.name ?? '',
    address: initial?.address ?? '',
    propertyType: initial?.propertyType ?? 'single-family',
    units: initial?.units ?? 1,
    sqft: initial?.sqft,
    acquisitionDate: initial?.acquisitionDate ?? '',
    purchasePrice: initial?.purchasePrice ?? 0,
    estimatedCurrentValue: initial?.estimatedCurrentValue ?? 0,
    notes: initial?.notes ?? '',
  })
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof CreatePropertyInput>(key: K, value: CreatePropertyInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Property name is required')
    if (!form.address.trim()) return setError('Address is required')
    setError(null)
    await onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Property Name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="1008-1012 S Rouse"
          required
        />
        <FormField
          label="Address"
          value={form.address}
          onChange={e => set('address', e.target.value)}
          placeholder="1008 S Rouse Ave"
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Property Type</label>
          <select
            value={form.propertyType}
            onChange={e => set('propertyType', e.target.value as PropertyType)}
            className="px-4 py-3 text-[15px] bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
          >
            {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <FormField
          label="Units"
          type="number"
          min="1"
          value={form.units}
          onChange={e => set('units', parseInt(e.target.value) || 1)}
        />
        <CurrencyInput
          label="Purchase Price"
          value={form.purchasePrice}
          onChange={v => set('purchasePrice', v)}
        />
        <CurrencyInput
          label="Estimated Current Value"
          value={form.estimatedCurrentValue}
          onChange={v => set('estimatedCurrentValue', v)}
        />
        <FormField
          label="Acquisition Date"
          type="date"
          value={form.acquisitionDate ?? ''}
          onChange={e => set('acquisitionDate', e.target.value)}
        />
        <FormField
          label="Square Footage"
          type="number"
          value={form.sqft ?? ''}
          onChange={e => set('sqft', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="Optional"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</label>
        <textarea
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 text-[15px] bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow placeholder:text-gray-400 resize-none"
          placeholder="Optional notes about this property..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-500 rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm">
          {loading ? 'Saving…' : 'Save Property'}
        </button>
      </div>
    </form>
  )
}
