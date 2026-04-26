import { useNavigate } from 'react-router-dom'
import { Property, Scorecard } from '@northstar/shared-types'
import ScoreBadge from '../ui/ScoreBadge'
import DecisionLabel from '../ui/DecisionLabel'
import { formatCurrency } from '../../utils/format'

export interface PropertyCardProps {
  property: Property
  scorecard?: Scorecard
  monthlyCashFlow?: number
  entryNeeded?: boolean
}

export default function PropertyCard({ property, scorecard, monthlyCashFlow, entryNeeded }: PropertyCardProps) {
  const navigate = useNavigate()
  const decision = scorecard?.userDecisionOverride ?? scorecard?.recommendedDecision
  const cfPositive = monthlyCashFlow != null && monthlyCashFlow >= 0

  return (
    <div
      onClick={() => navigate(`/properties/${property.id}`)}
      className="bg-white rounded-2xl shadow-card p-5 cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] active:shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate leading-snug">{property.name}</p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{property.address}</p>
        </div>
        {scorecard && <ScoreBadge score={scorecard.overallScore} size="sm" />}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Units</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{property.units}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Cash Flow</p>
          <p className={`mt-1 text-sm font-semibold ${monthlyCashFlow != null ? (cfPositive ? 'text-emerald-600' : 'text-red-500') : 'text-gray-400'}`}>
            {monthlyCashFlow != null ? `${formatCurrency(monthlyCashFlow)}/mo` : '—'}
          </p>
        </div>
      </div>

      {(decision || entryNeeded) && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 flex-wrap">
          {decision && <DecisionLabel decision={decision} size="sm" />}
          {entryNeeded && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              Entry Needed
            </span>
          )}
        </div>
      )}
    </div>
  )
}
