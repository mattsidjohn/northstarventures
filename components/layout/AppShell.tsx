'use client'

import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F2F2F7' }}>
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
  )
}
