import { Scorecard } from '@/types'
import DecisionLabel from '@/components/ui/DecisionLabel'

export interface DecisionPanelProps {
  scorecard: Scorecard
}

export default function DecisionPanel({ scorecard }: DecisionPanelProps) {
  const effectiveDecision = scorecard.userDecisionOverride ?? scorecard.recommendedDecision
  const isOverridden = !!scorecard.userDecisionOverride

  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Decision</p>
          <div className="mt-2 flex items-center gap-2">
            <DecisionLabel decision={effectiveDecision} size="md" />
            {isOverridden && (
              <span className="text-xs text-gray-400 italic">
                (overridden from {scorecard.recommendedDecision})
              </span>
            )}
          </div>
        </div>
      </div>

      {scorecard.decisionReasons.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Reasoning</p>
          <ul className="space-y-1">
            {scorecard.decisionReasons.map((r, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-brand-400 shrink-0">✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {scorecard.decisionNotes && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
          <p className="text-sm text-gray-700">{scorecard.decisionNotes}</p>
        </div>
      )}

      {scorecard.actionPlan && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs font-semibold text-blue-600 mb-1">Action Plan</p>
          <p className="text-sm text-blue-900">{scorecard.actionPlan}</p>
        </div>
      )}
    </div>
  )
}
