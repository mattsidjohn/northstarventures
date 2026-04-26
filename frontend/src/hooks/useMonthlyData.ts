import { useState, useEffect, useCallback } from 'react'
import { MonthlyData, CreateMonthlyDataInput } from '@northstar/shared-types'
import { api } from '../api/client'

interface UseMonthlyDataReturn {
  monthlyData: MonthlyData[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  upsertEntry: (input: CreateMonthlyDataInput) => Promise<MonthlyData>
  deleteEntry: (monthId: string) => Promise<void>
  getEntry: (year: number, month: number) => MonthlyData | undefined
}

export function useMonthlyData(propertyId: string): UseMonthlyDataReturn {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!propertyId) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.monthly.list(propertyId)
      setMonthlyData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monthly data')
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => { refetch() }, [refetch])

  const upsertEntry = useCallback(async (input: CreateMonthlyDataInput): Promise<MonthlyData> => {
    const saved = await api.monthly.upsert(propertyId, input)
    setMonthlyData(prev => {
      const exists = prev.find(d => d.year === saved.year && d.month === saved.month)
      if (exists) return prev.map(d => d.id === saved.id ? saved : d)
      return [...prev, saved].sort((a, b) => b.year - a.year || b.month - a.month)
    })
    return saved
  }, [propertyId])

  const deleteEntry = useCallback(async (monthId: string): Promise<void> => {
    await api.monthly.delete(propertyId, monthId)
    setMonthlyData(prev => prev.filter(d => d.id !== monthId))
  }, [propertyId])

  const getEntry = useCallback((year: number, month: number): MonthlyData | undefined => {
    return monthlyData.find(d => d.year === year && d.month === month)
  }, [monthlyData])

  return { monthlyData, loading, error, refetch, upsertEntry, deleteEntry, getEntry }
}
