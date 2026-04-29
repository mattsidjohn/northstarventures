import { DecisionRating } from '@/types'

export interface DecisionLabelProps {
  decision: DecisionRating
  size?: 'sm' | 'md'
}

const DECISION_STYLES: Record<DecisionRating, string> = {
  'Strong Hold': 'bg-emerald-100 text-emerald-700',
  'Hold':        'bg-green-100 text-green-700',
  'Monitor':     'bg-amber-100 text-amber-700',
  'Sell':        'bg-red-100 text-red-700',
}

export default function DecisionLabel({ decision, size = 'md' }: DecisionLabelProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${DECISION_STYLES[decision]} ${sizeClass}`}>
      {decision}
    </span>
  )
}
