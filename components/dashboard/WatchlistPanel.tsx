'use client'

import { useRouter } from 'next/navigation'
import { Scorecard, Property, DecisionRating } from '@/types'
import DecisionLabel from '@/components/ui/DecisionLabel'
import ScoreBadge from '@/components/ui/ScoreBadge'

export interface WatchlistPanelProps {
  scorecards: Scorecard[]
  properties: Property[]
  decisions?: DecisionRating[]
}

const ALERT_DECISIONS: DecisionRating[] = ['Monitor', 'Sell']

export default function WatchlistPanel({ scorecards, properties, decisions = ALERT_DECISIONS }: WatchlistPanelProps) {
  const router = useRouter()
  const flagged = scorecards.filter(s => {
    const d = s.userDecisionOverride ?? s.recommendedDecision
    return decisions.includes(d)
  })

  if (flagged.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Action Items</h3>
        <p className="text-sm text-gray-400">No action items for this period.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Action Items ({flagged.length})</h3>
      <div className="divide-y divide-gray-100">
        {flagged.map(sc => {
          const prop = properties.find(p => p.id === sc.propertyId)
          const decision = sc.userDecisionOverride ?? sc.recommendedDecision
          return (
            <div
              key={sc.id}
              onClick={() => router.push(`/properties/${sc.propertyId}`)}
              className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 -mx-5 px-5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{prop?.name ?? 'Unknown'}</p>
                <p className="text-xs text-gray-400">{sc.period} {sc.year}</p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <ScoreBadge score={sc.overallScore} size="sm" />
                <DecisionLabel decision={decision} size="sm" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
