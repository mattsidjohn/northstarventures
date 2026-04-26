export interface MetricBarProps {
  value: number
  max?: number
  label?: string
  color?: 'blue' | 'green' | 'yellow' | 'red'
}

const COLOR_CLASSES = {
  blue: 'bg-brand-500',
  green: 'bg-emerald-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
}

function scoreToColor(value: number, max: number): 'blue' | 'green' | 'yellow' | 'red' {
  const pct = value / max
  if (pct >= 0.8) return 'green'
  if (pct >= 0.6) return 'blue'
  if (pct >= 0.4) return 'yellow'
  return 'red'
}

export default function MetricBar({ value, max = 5, label, color }: MetricBarProps) {
  const pct = Math.min((value / max) * 100, 100)
  const barColor = color ?? scoreToColor(value, max)

  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span className="font-medium text-gray-700">{value.toFixed(1)}/{max}</span>
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${COLOR_CLASSES[barColor]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
