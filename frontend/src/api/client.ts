import {
  Property,
  CreatePropertyInput,
  UpdatePropertyInput,
  MonthlyData,
  CreateMonthlyDataInput,
  Scorecard,
  UpdateScorecardInput,
  PortfolioSummary,
  BackupData,
  Deal,
  CreateDealInput,
  UpdateDealInput,
} from '@northstar/shared-types'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? 'Request failed')
  return json.data as T
}

export const api = {
  properties: {
    list: () => request<Property[]>('/properties'),
    get: (id: string) => request<Property>(`/properties/${id}`),
    create: (input: CreatePropertyInput) =>
      request<Property>('/properties', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: UpdatePropertyInput) =>
      request<Property>(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    delete: (id: string) =>
      request<{ id: string }>(`/properties/${id}`, { method: 'DELETE' }),
  },

  monthly: {
    list: (propertyId: string) =>
      request<MonthlyData[]>(`/properties/${propertyId}/monthly`),
    upsert: (propertyId: string, input: CreateMonthlyDataInput) =>
      request<MonthlyData>(`/properties/${propertyId}/monthly`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    delete: (propertyId: string, monthId: string) =>
      request<{ id: string }>(`/properties/${propertyId}/monthly/${monthId}`, { method: 'DELETE' }),
  },

  scorecards: {
    list: (propertyId: string) =>
      request<Scorecard[]>(`/properties/${propertyId}/scorecards`),
    generate: (propertyId: string, year: number, period: 'H1' | 'H2') =>
      request<Scorecard>(`/properties/${propertyId}/scorecards`, {
        method: 'POST',
        body: JSON.stringify({ year, period }),
      }),
    update: (propertyId: string, scorecardId: string, input: UpdateScorecardInput) =>
      request<Scorecard>(`/properties/${propertyId}/scorecards/${scorecardId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
  },

  portfolio: {
    summary: (year: number, period: 'H1' | 'H2') =>
      request<PortfolioSummary>(`/portfolio/summary?year=${year}&period=${period}`),
  },

  deals: {
    list: () => request<Deal[]>('/deals'),
    create: (input: CreateDealInput) =>
      request<Deal>('/deals', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: UpdateDealInput) =>
      request<Deal>(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    delete: (id: string) =>
      request<{ id: string }>(`/deals/${id}`, { method: 'DELETE' }),
  },

  backup: {
    export: async () => {
      const res = await fetch('/api/backup/export')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `northstar-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    },
    import: (data: BackupData) =>
      request<{ imported: { properties: number; monthlyData: number; scorecards: number } }>(
        '/backup/import',
        { method: 'POST', body: JSON.stringify(data) }
      ),
  },
}
