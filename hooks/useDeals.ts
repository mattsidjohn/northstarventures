import { useState, useEffect, useCallback } from 'react'
import { Deal, CreateDealInput, UpdateDealInput } from '@/types'
import { api } from '@/api/client'

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.deals.list()
      setDeals(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const createDeal = useCallback(async (input: CreateDealInput): Promise<Deal> => {
    const deal = await api.deals.create(input)
    setDeals(prev => [deal, ...prev])
    return deal
  }, [])

  const updateDeal = useCallback(async (id: string, input: UpdateDealInput): Promise<Deal> => {
    const deal = await api.deals.update(id, input)
    setDeals(prev => prev.map(d => d.id === id ? deal : d))
    return deal
  }, [])

  const deleteDeal = useCallback(async (id: string): Promise<void> => {
    await api.deals.delete(id)
    setDeals(prev => prev.filter(d => d.id !== id))
  }, [])

  return { deals, loading, refetch, createDeal, updateDeal, deleteDeal }
}
