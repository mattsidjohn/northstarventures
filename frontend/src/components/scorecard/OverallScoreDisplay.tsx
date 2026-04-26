import { Scorecard } from '@northstar/shared-types'
import MetricBar from '../ui/MetricBar'

export interface OverallScoreDisplayProps {
  scorecard: Scorecard
}

function bandColor(score: number): string {
  if (score >= 5) return 'text-emerald-700'
  if (score >= 4) return 'text-green-600'
  if (score >= 3) return 'text-yellow-600'
  return 'text-red-600'
}

export default function OverallScoreDisplay({ scorecard }: OverallScoreDisplayProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6 text-center">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Overall Score</p>
      <p className={`mt-2 text-6xl font-bold ${bandColor(scorecard.overallScore)}`}>
        {scorecard.overallScore.toFixed(1)}
      </p>
      <p className="mt-1 text-sm text-gray-500">out of 5.0</p>
      <div className="mt-4 max-w-xs mx-auto">
        <MetricBar value={scorecard.overallScore} max={5} />
      </div>
      <div className={`mt-3 inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${bandColor(scorecard.overallScore)} bg-gray-100`}>
        {scorecard.interpretation}
      </div>
    </div>
  )
}
