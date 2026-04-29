'use client'
import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MonthlyData, CreatePropertyInput } from '@/types'
import Header from '@/components/layout/Header'
import PageContainer from '@/components/layout/PageContainer'
import TabGroup from '@/components/ui/TabGroup'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import PropertyForm from '@/components/properties/PropertyForm'
import ForecastChart from '@/components/properties/ForecastChart'
import MonthlyHistoryTable from '@/components/monthly/MonthlyHistoryTable'
import MonthlyMetricsBar from '@/components/monthly/MonthlyMetricsBar'
import DecisionLabel from '@/components/ui/DecisionLabel'
import ScoreBadge from '@/components/ui/ScoreBadge'
import CurrencyInput from '@/components/ui/CurrencyInput'
import CategoryScoreCard from '@/components/scorecard/CategoryScoreCard'
import OverallScoreDisplay from '@/components/scorecard/OverallScoreDisplay'
import DecisionPanel from '@/components/scorecard/DecisionPanel'
import DecisionOverride from '@/components/scorecard/DecisionOverride'
import FinancialSummary from '@/components/scorecard/FinancialSummary'
import { useProperty, useProperties } from '@/hooks/useProperties'
import { useMonthlyData } from '@/hooks/useMonthlyData'
import { useScorecard } from '@/hooks/useScorecard'
import { calculateTrailing3MonthsMetrics } from '@/utils/metricsClient'
import { computeLiveScorecard, mergeLiveWithStored } from '@/utils/scorecardClient'
import { MONTH_NAMES } from '@/utils/format'

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="mt-1 font-semibold text-gray-900">{value}</div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}

const TYPE_LABELS: Record<string, string> = {
  'single-family': 'Single Family',
  'duplex': 'Duplex',
  'multi-unit': 'Multi-Unit',
  'commercial': 'Commercial',
  'mixed-use': 'Mixed Use',
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const isNew = id === 'new'
  const { property, loading, refetch } = useProperty(isNew ? '' : id!)
  const { createProperty, updateProperty } = useProperties()
  const { monthlyData, upsertEntry, deleteEntry, getEntry } = useMonthlyData(isNew ? '' : id!)
  const { getScorecard, generate, update } = useScorecard(isNew ? '' : id!)

  const [isEditing, setIsEditing] = useState(false)

  const now = new Date()
  const [entryForm, setEntryForm] = useState<{ year: number; month: number; income: number; expenses: number; notes: string } | null>(null)
  const [entrySaving, setEntrySaving] = useState(false)
  const [entrySaved, setEntrySaved] = useState(false)

  function entryDefaults(year: number, month: number, existing: MonthlyData | undefined) {
    if (existing) return { income: existing.income, expenses: existing.expenses, notes: existing.notes ?? '' }
    // No entry for this month — seed from the most recent prior month
    const prior = monthlyData.find(m => m.year * 12 + m.month < year * 12 + month)
    return { income: prior?.income ?? 0, expenses: prior?.expenses ?? 0, notes: '' }
  }

  function openEntryForm() {
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const existing = getEntry(year, month)
    setEntryForm({ year, month, ...entryDefaults(year, month, existing) })
    setEntrySaved(false)
  }

  async function saveEntry() {
    if (!entryForm || !id || isNew) return
    setEntrySaving(true)
    try {
      await upsertEntry({ propertyId: id, ...entryForm })
      setEntrySaved(true)
      setTimeout(() => { setEntryForm(null); setEntrySaved(false) }, 800)
    } finally {
      setEntrySaving(false)
    }
  }

  // All-time average cash flow across every month (not period-filtered — used for overview + forecast)
  const avgMonthlyCashFlow = useMemo(() => {
    if (monthlyData.length === 0) return null
    return monthlyData.reduce((sum, m) => sum + m.income - m.expenses, 0) / monthlyData.length
  }, [monthlyData])

  // Stable storage key: current half-year (used for saving overrides to DB)
  const [scorecardYear, scorecardPeriod] = useMemo((): [number, 'H1' | 'H2'] => {
    const now = new Date()
    return [now.getFullYear(), now.getMonth() < 6 ? 'H1' : 'H2']
  }, [])

  // Trailing 3-month metrics (used for live score badge and scorecard tab)
  const semiAnnual = useMemo(() => {
    if (monthlyData.length === 0) return null
    return calculateTrailing3MonthsMetrics(monthlyData)
  }, [monthlyData])

  const liveScore = useMemo(() => {
    if (!semiAnnual || semiAnnual.monthsWithData === 0) return null
    return computeLiveScorecard(semiAnnual)
  }, [semiAnnual])

  // Full Scorecard object merging live score with stored overrides/notes
  const scorecard = useMemo(() => {
    if (!semiAnnual || !id || isNew) return null
    const live = computeLiveScorecard(semiAnnual)
    const stored = getScorecard(scorecardYear, scorecardPeriod)
    return mergeLiveWithStored(live, id, scorecardYear, scorecardPeriod, stored)
  }, [semiAnnual, id, isNew, scorecardYear, scorecardPeriod, getScorecard])

  // Auto-save to DB so DecisionOverride has a record to write to
  useEffect(() => {
    if (!id || isNew || monthlyData.length === 0) return
    generate(scorecardYear, scorecardPeriod).catch(() => {})
  }, [id, isNew, monthlyData.length]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateProperty(input: CreatePropertyInput) {
    const created = await createProperty(input)
    router.push(`/properties/${created.id}`)
  }

  async function handleUpdateProperty(input: CreatePropertyInput) {
    if (!property) return
    await updateProperty(property.id, input)
    await refetch()
    setIsEditing(false)
  }

  if (isNew) {
    return (
      <div>
        <Header
          title="Add Property"
          actions={
            <button onClick={() => router.push('/properties')} className="text-sm text-gray-500 hover:text-gray-700">
              ← Back
            </button>
          }
        />
        <PageContainer className="max-w-2xl">
          <PropertyForm onSubmit={handleCreateProperty} onCancel={() => router.push('/properties')} />
        </PageContainer>
      </div>
    )
  }

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />
  if (!property) return <div className="p-8 text-gray-500">Property not found.</div>

  const baseValue = (property.estimatedCurrentValue ?? 0) > 0
    ? property.estimatedCurrentValue
    : property.purchasePrice

  if (isEditing) {
    return (
      <div>
        <Header
          title={property.name}
          subtitle={property.address}
          actions={
            <button onClick={() => setIsEditing(false)} className="text-sm text-gray-500 hover:text-gray-700">
              ← Cancel
            </button>
          }
        />
        <PageContainer className="max-w-2xl">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Edit Property</h3>
          <PropertyForm
            initial={property}
            onSubmit={handleUpdateProperty}
            onCancel={() => setIsEditing(false)}
          />
        </PageContainer>
      </div>
    )
  }

  return (
    <div>
      <Header
        title={property.name}
        subtitle={property.address}
        actions={
          <button onClick={() => router.push('/properties')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Properties
          </button>
        }
      />
      <PageContainer>
        {/* Property info panel + Edit button — above tabs */}
        <div className="bg-white rounded-2xl shadow-card p-5 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <InfoItem label="Type" value={TYPE_LABELS[property.propertyType] ?? property.propertyType} />
              <InfoItem label="Units" value={String(property.units)} />
              {property.sqft ? <InfoItem label="Sq Ft" value={property.sqft.toLocaleString()} /> : null}
              <InfoItem label="Purchase Price" value={`$${property.purchasePrice.toLocaleString()}`} />
              {(property.estimatedCurrentValue ?? 0) > 0
                ? <InfoItem label="Est. Value" value={`$${property.estimatedCurrentValue.toLocaleString()}`} />
                : null}
              {property.acquisitionDate
                ? <InfoItem label="Acquired" value={property.acquisitionDate} />
                : null}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="shrink-0 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Edit Property
            </button>
          </div>
          {property.notes && (
            <p className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 whitespace-pre-line">
              {property.notes}
            </p>
          )}
        </div>

        <TabGroup
          tabs={[
            {
              key: 'overview',
              label: 'Overview',
              content: (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      label="Score"
                      value={
                        liveScore ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <ScoreBadge score={liveScore.overallScore} size="sm" />
                            <DecisionLabel decision={liveScore.recommendedDecision} size="sm" />
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No data yet</span>
                        )
                      }
                    />
                    <StatCard
                      label="Avg Monthly Cash Flow"
                      value={
                        avgMonthlyCashFlow != null ? (
                          <span className={avgMonthlyCashFlow >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                            ${Math.round(avgMonthlyCashFlow).toLocaleString()}/mo
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">No data yet</span>
                        )
                      }
                    />
                  </div>
                  <ForecastChart
                    purchasePrice={property.purchasePrice}
                    baseValue={baseValue}
                    avgMonthlyCashFlow={avgMonthlyCashFlow ?? 0}
                  />
                </div>
              ),
            },
            {
              key: 'scorecard',
              label: 'Scorecard',
              content: (
                <div className="space-y-6">
                  {monthlyData.length === 0 ? (
                    <EmptyState
                      icon="📅"
                      title="No monthly data"
                      description="Enter at least one month of data to see a scorecard."
                    />
                  ) : !scorecard ? null : (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <OverallScoreDisplay scorecard={scorecard} />
                        <DecisionPanel scorecard={scorecard} />
                        <DecisionOverride
                          scorecard={scorecard}
                          onSave={async input => {
                            let sid = scorecard.id
                            if (!sid) {
                              const sc = await generate(scorecardYear, scorecardPeriod)
                              sid = sc.id
                            }
                            await update(sid, input)
                          }}
                        />
                      </div>
                      <CategoryScoreCard
                        label="Financial Score"
                        categoryScore={scorecard.financial}
                        weight="Cash Flow Margin"
                      />
                      {semiAnnual && (
                        <>
                          <FinancialSummary metrics={semiAnnual} />
                          <p className="text-xs text-gray-400 text-right">
                            Based on the {semiAnnual.monthsWithData} most recent month{semiAnnual.monthsWithData !== 1 ? 's' : ''} of data
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
              ),
            },
            {
              key: 'monthly',
              label: 'Monthly History',
              content: (
                <div className="space-y-4">
                  {entryForm ? (
                    <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">
                          Add Entry
                        </h3>
                        <button onClick={() => setEntryForm(null)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex flex-col gap-1.5 w-28">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Year</label>
                          <select
                            value={entryForm.year}
                            onChange={e => {
                              const year = parseInt(e.target.value)
                              const existing = getEntry(year, entryForm.month)
                              setEntryForm({ year, month: entryForm.month, ...entryDefaults(year, entryForm.month, existing) })
                            }}
                            className="px-3 py-3 text-[15px] bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          >
                            {Array.from({ length: 6 }, (_, i) => now.getFullYear() - i).map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1">
                          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Month</label>
                          <select
                            value={entryForm.month}
                            onChange={e => {
                              const month = parseInt(e.target.value)
                              const existing = getEntry(entryForm.year, month)
                              setEntryForm({ year: entryForm.year, month, ...entryDefaults(entryForm.year, month, existing) })
                            }}
                            className="px-3 py-3 text-[15px] bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          >
                            {MONTH_NAMES.map((name, i) => (
                              <option key={i + 1} value={i + 1}>{name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <MonthlyMetricsBar income={entryForm.income} expenses={entryForm.expenses} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CurrencyInput
                          label="Total Income"
                          value={entryForm.income}
                          onChange={v => setEntryForm({ ...entryForm, income: v })}
                          hint="All rent and other income collected"
                        />
                        <CurrencyInput
                          label="Total Expenses"
                          value={entryForm.expenses}
                          onChange={v => setEntryForm({ ...entryForm, expenses: v })}
                          hint="All expenses including bank payment"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</label>
                        <textarea
                          value={entryForm.notes}
                          onChange={e => setEntryForm({ ...entryForm, notes: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 text-[15px] bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow placeholder:text-gray-400 resize-none"
                          placeholder="Any notable events, repairs, or context for this month..."
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={saveEntry}
                          disabled={entrySaving}
                          className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${
                            entrySaved ? 'bg-emerald-500' : 'bg-brand-500 hover:bg-brand-600'
                          }`}
                        >
                          {entrySaved ? '✓ Saved' : entrySaving ? 'Saving…' : 'Save Entry'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">{monthlyData.length} months of data</p>
                      <button
                        onClick={() => openEntryForm()}
                        className="px-4 py-2 text-sm font-semibold text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
                      >
                        + Add Month
                      </button>
                    </div>
                  )}
                  <MonthlyHistoryTable
                    monthlyData={monthlyData}
                    onSave={async input => { await upsertEntry(input) }}
                    onDelete={async id => { await deleteEntry(id) }}
                  />
                </div>
              ),
            },
          ]}
        />
      </PageContainer>
    </div>
  )
}
