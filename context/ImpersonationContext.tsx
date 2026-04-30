'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const STORAGE_KEY = 'nsv_impersonate'

interface ImpersonationState {
  userId: string
  email: string
}

interface ImpersonationContextValue {
  impersonating: ImpersonationState | null
  startImpersonating: (userId: string, email: string) => void
  stopImpersonating: () => void
}

const ImpersonationContext = createContext<ImpersonationContextValue>({
  impersonating: null,
  startImpersonating: () => {},
  stopImpersonating: () => {},
})

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonating, setImpersonating] = useState<ImpersonationState | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setImpersonating(JSON.parse(stored))
    } catch {}
  }, [])

  function startImpersonating(userId: string, email: string) {
    const state = { userId, email }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    setImpersonating(state)
  }

  function stopImpersonating() {
    localStorage.removeItem(STORAGE_KEY)
    setImpersonating(null)
  }

  return (
    <ImpersonationContext.Provider value={{ impersonating, startImpersonating, stopImpersonating }}>
      {children}
    </ImpersonationContext.Provider>
  )
}

export function useImpersonation() {
  return useContext(ImpersonationContext)
}
