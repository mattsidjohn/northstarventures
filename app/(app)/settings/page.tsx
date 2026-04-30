'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IMaskInput } from 'react-imask'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import PageContainer from '@/components/layout/PageContainer'

const labelClass = 'text-xs font-semibold text-gray-600 uppercase tracking-wider'
const inputClass = 'w-full px-4 py-3 text-[15px] bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow placeholder:text-gray-400'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setEmail(user.email ?? '')
      const m = user.user_metadata ?? {}
      setForm({
        firstName: m.first_name ?? '',
        lastName:  m.last_name  ?? '',
        phone:     m.phone      ?? '',
        company:   m.company    ?? '',
        address:   m.address    ?? '',
        city:      m.city       ?? '',
        state:     m.state      ?? '',
        zip:       m.zip        ?? '',
      })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function setField(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: form.firstName,
          last_name:  form.lastName,
          phone:      form.phone,
          company:    form.company,
          address:    form.address,
          city:       form.city,
          state:      form.state,
          zip:        form.zip,
        },
      })
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header
        title="Settings"
        subtitle="Account & profile"
        actions={
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back
          </button>
        }
      />
      <PageContainer className="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-6">

          {/* Account */}
          <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-700">Account</h3>
            <Field label="Email" hint="Contact support to change your email address.">
              <input
                type="email"
                value={email}
                disabled
                className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`}
              />
            </Field>
          </div>

          {/* Profile */}
          <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-700">Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="First Name">
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => setField('firstName', e.target.value)}
                  placeholder="Jane"
                  className={inputClass}
                />
              </Field>
              <Field label="Last Name">
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => setField('lastName', e.target.value)}
                  placeholder="Smith"
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Phone">
              <IMaskInput
                mask="(000) 000-0000"
                value={form.phone}
                onAccept={(value: string) => setField('phone', value)}
                placeholder="(555) 000-0000"
                className={inputClass}
              />
            </Field>
            <Field label="Company">
              <input
                type="text"
                value={form.company}
                onChange={e => setField('company', e.target.value)}
                placeholder="North Star Ventures"
                className={inputClass}
              />
            </Field>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-700">Address</h3>
            <Field label="Street Address">
              <input
                type="text"
                value={form.address}
                onChange={e => setField('address', e.target.value)}
                placeholder="123 Main St"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Field label="City">
                <input
                  type="text"
                  value={form.city}
                  onChange={e => setField('city', e.target.value)}
                  placeholder="Springfield"
                  className={inputClass}
                />
              </Field>
              <Field label="State">
                <IMaskInput
                  mask="aa"
                  prepare={(val: string) => val.toUpperCase()}
                  value={form.state}
                  onAccept={(value: string) => setField('state', value)}
                  placeholder="MO"
                  className={inputClass}
                />
              </Field>
              <Field label="Zip">
                <IMaskInput
                  mask="00000"
                  value={form.zip}
                  onAccept={(value: string) => setField('zip', value)}
                  placeholder="65801"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-between">
            {error && <p className="text-sm text-red-500">{error}</p>}
            {!error && <span />}
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${
                saved ? 'bg-emerald-500' : 'bg-brand-500 hover:bg-brand-600'
              }`}
            >
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

        </form>
      </PageContainer>
    </div>
  )
}
