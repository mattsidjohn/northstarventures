import { useState } from 'react'
import { Scorecard, DecisionRating, UpdateScorecardInput } from '@northstar/shared-types'

export interface DecisionOverrideProps {
  scorecard: Scorecard
  onSave: (update: UpdateScorecardInput) => Promise<void>
}

const DECISIONS: DecisionRating[] = ['Strong Hold', 'Hold', 'Monitor', 'Sell']

const inputClass = 'px-4 py-3 text-[15px] bg-gray-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow placeholder:text-gray-400'

export default function DecisionOverride({ scorecard, onSave }: DecisionOverrideProps) {
  const [override, setOverride] = useState<DecisionRating | ''>(scorecard.userDecisionOverride ?? '')
  const [notes, setNotes] = useState(scorecard.decisionNotes ?? '')
  const [actionPlan, setActionPlan] = useState(scorecard.actionPlan ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave({
      userDecisionOverride: override || undefined,
      decisionNotes: notes || undefined,
      actionPlan: actionPlan || undefined,
    })
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-900">Override &amp; Notes</p>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Override Decision</label>
        <select
          value={override}
          onChange={e => setOverride(e.target.value as DecisionRating | '')}
          className={inputClass}
        >
          <option value="">Use recommended ({scorecard.recommendedDecision})</option>
          {DECISIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Decision Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="Notes on why this decision was made..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action Plan</label>
        <textarea
          value={actionPlan}
          onChange={e => setActionPlan(e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="What steps will you take this period?"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-500 rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
