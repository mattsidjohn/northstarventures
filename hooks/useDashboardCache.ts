import { useCallback } from 'react'
import { Scorecard } from '@/types'

export interface DashboardStats {
  totalProperties: number
  totalUnits: number
  projectedAnnualIncome: number
  projectedAnnualExpenses: number
  projectedAnnualCashFlow: number
  totalPurchasePrice: number
  totalBaseValue: number
}

interface DashboardCache {
  portfolioStats: DashboardStats
  cashFlowMap: Record<string, number>
  scorecards: Scorecard[]
  entryNeededIds: string[]
  cachedAt: string
}

export interface DashboardPayload {
  portfolioStats: DashboardStats
  cashFlowMap: Record<string, number>
  scorecards: Scorecard[]
  entryNeededIds: string[]
}

const CACHE_KEY = 'northstar_dashboard_v1'

export function useDashboardCache() {
  const read = useCallback((): DashboardCache | null => {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as DashboardCache
    } catch {
      return null
    }
  }, [])

  // Returns true if the data differed from what was cached (i.e. an update was written)
  const write = useCallback((payload: DashboardPayload): boolean => {
    try {
      const existing = localStorage.getItem(CACHE_KEY)
      if (existing) {
        const { cachedAt: _ts, ...prev } = JSON.parse(existing) as DashboardCache
        if (JSON.stringify(prev) === JSON.stringify(payload)) return false
      }
      const entry: DashboardCache = { ...payload, cachedAt: new Date().toISOString() }
      localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
      return true
    } catch {
      return false
    }
  }, [])

  return { read, write }
}
