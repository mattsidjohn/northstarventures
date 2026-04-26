import { useState, useEffect, useCallback } from 'react'
import { Scorecard, UpdateScorecardInput } from '@northstar/shared-types'
import { api } from '../api/client'

interface UseScorecardReturn {
  scorecards: Scorecard[]
  loading: boolean
  error: string | null
  generating: boolean
  refetch: () => Promise<void>
  generate: (year: number, period: 'H1' | 'H2') => Promise<Scorecard>
  update: (scorecardId: string, input: UpdateScorecardInput) => Promise<Scorecard>
  getScorecard: (year: number, period: 'H1' | 'H2') => Scorecard | undefined
}

export function useScorecard(propertyId: string): UseScorecardReturn {
  const [scorecards, setScorecards] = useState<Scorecard[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!propertyId) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.scorecards.list(propertyId)
      setScorecards(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scorecards')
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => { refetch() }, [refetch])

  const generate = useCallback(async (year: number, period: 'H1' | 'H2'): Promise<Scorecard> => {
    setGenerating(true)
    setError(null)
    try {
      const scorecard = await api.scorecards.generate(propertyId, year, period)
      setScorecards(prev => {
        const exists = prev.find(s => s.year === year && s.period === period)
        if (exists) return prev.map(s => s.id === scorecard.id ? scorecard : s)
        return [...prev, scorecard]
      })
      return scorecard
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate scorecard'
      setError(msg)
      throw err
    } finally {
      setGenerating(false)
    }
  }, [propertyId])

  const update = useCallback(async (scorecardId: string, input: UpdateScorecardInput): Promise<Scorecard> => {
    const updated = await api.scorecards.update(propertyId, scorecardId, input)
    setScorecards(prev => prev.map(s => s.id === scorecardId ? updated : s))
    return updated
  }, [propertyId])

  const getScorecard = useCallback((year: number, period: 'H1' | 'H2'): Scorecard | undefined => {
    return scorecards.find(s => s.year === year && s.period === period)
  }, [scorecards])

  return { scorecards, loading, error, generating, refetch, generate, update, getScorecard }
}
