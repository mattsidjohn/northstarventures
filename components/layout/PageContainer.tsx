import { ReactNode } from 'react'

export interface PageContainerProps {
  children: ReactNode
  className?: string
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto ${className}`}>
      {children}
    </div>
  )
}
