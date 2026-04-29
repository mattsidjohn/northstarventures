export interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

function scoreColor(score: number): string {
  if (score >= 4.5) return 'bg-emerald-100 text-emerald-700'
  if (score >= 3.8) return 'bg-green-100 text-green-700'
  if (score >= 3.0) return 'bg-amber-100 text-amber-700'
  if (score >= 2.3) return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3.5 py-1.5 text-base',
}

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${scoreColor(score)} ${SIZE_CLASSES[size]}`}>
      {score.toFixed(1)}
    </span>
  )
}
