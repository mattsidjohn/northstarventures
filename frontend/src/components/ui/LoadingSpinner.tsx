export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP = {
  sm: { outer: 'w-4 h-4', border: 2 },
  md: { outer: 'w-8 h-8', border: 3 },
  lg: { outer: 'w-12 h-12', border: 4 },
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const { outer, border } = SIZE_MAP[size]
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${outer} rounded-full animate-spin`}
        style={{
          borderWidth: border,
          borderStyle: 'solid',
          borderColor: '#E5E7EB',
          borderTopColor: '#007AFF',
        }}
      />
    </div>
  )
}
