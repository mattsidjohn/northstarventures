import { CategoryScore } from '@/types'
import ScoreBadge from '@/components/ui/ScoreBadge'
import MetricBar from '@/components/ui/MetricBar'

export interface CategoryScoreCardProps {
  label: string
  categoryScore: CategoryScore
  weight: string
}

export default function CategoryScoreCard({ label, categoryScore, weight }: CategoryScoreCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-xs text-gray-400">{weight} of overall</p>
        </div>
        <ScoreBadge score={categoryScore.score} size="lg" />
      </div>
      <MetricBar value={categoryScore.score} max={5} />
      {categoryScore.factors.length > 0 && (
        <ul className="mt-4 space-y-1">
          {categoryScore.factors.map((f, i) => (
            <li key={i} className="text-xs text-gray-600 flex gap-2">
              <span className="text-gray-400 shrink-0">·</span>
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
