'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { ImpersonationProvider, useImpersonation } from '@/context/ImpersonationContext'

function ImpersonationBanner() {
  const { impersonating, stopImpersonating } = useImpersonation()
  const router = useRouter()
  if (!impersonating) return null
  return (
    <div className="bg-amber-500 text-white text-xs font-semibold flex items-center justify-between px-4 py-2 shrink-0 no-print">
      <span>Viewing as {impersonating.email}</span>
      <button
        onClick={() => { stopImpersonating(); router.push('/admin') }}
        className="underline hover:no-underline"
      >
        Stop impersonating
      </button>
    </div>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: '#F2F2F7' }}>
      <ImpersonationBanner />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop only */}
        <div className="hidden md:flex shrink-0">
          <Sidebar />
        </div>

        {/* Main scroll area */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-20 md:pb-0">
          {children}
        </main>

        {/* Bottom nav — mobile only */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <ImpersonationProvider>
      <Shell>{children}</Shell>
    </ImpersonationProvider>
  )
}
