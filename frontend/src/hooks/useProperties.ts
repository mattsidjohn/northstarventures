import { useState, useEffect, useCallback } from 'react'
import { Property, CreatePropertyInput, UpdatePropertyInput } from '@northstar/shared-types'
import { api } from '../api/client'

interface UsePropertiesReturn {
  properties: Property[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createProperty: (input: CreatePropertyInput) => Promise<Property>
  updateProperty: (id: string, input: UpdatePropertyInput) => Promise<Property>
  deleteProperty: (id: string) => Promise<void>
}

export function useProperties(): UsePropertiesReturn {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.properties.list()
      setProperties(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load properties')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const createProperty = useCallback(async (input: CreatePropertyInput): Promise<Property> => {
    const created = await api.properties.create(input)
    setProperties(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    return created
  }, [])

  const updateProperty = useCallback(async (id: string, input: UpdatePropertyInput): Promise<Property> => {
    const updated = await api.properties.update(id, input)
    setProperties(prev => prev.map(p => p.id === id ? updated : p))
    return updated
  }, [])

  const deleteProperty = useCallback(async (id: string): Promise<void> => {
    await api.properties.delete(id)
    setProperties(prev => prev.filter(p => p.id !== id))
  }, [])

  return { properties, loading, error, refetch, createProperty, updateProperty, deleteProperty }
}

interface UsePropertyReturn {
  property: Property | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProperty(id: string): UsePropertyReturn {
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.properties.get(id)
      setProperty(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load property')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { refetch() }, [refetch])

  return { property, loading, error, refetch }
}
