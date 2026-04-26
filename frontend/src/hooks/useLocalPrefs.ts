import { useState, useCallback } from 'react'

interface LocalPrefs {
  selectedYear: number
  selectedPeriod: 'H1' | 'H2'
  selectedPropertyId: string | null
}

const STORAGE_KEY = 'northstar_prefs'

function loadPrefs(): LocalPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as LocalPrefs
  } catch {}
  const now = new Date()
  return {
    selectedYear: now.getFullYear(),
    selectedPeriod: now.getMonth() < 6 ? 'H1' : 'H2',
    selectedPropertyId: null,
  }
}

function savePrefs(prefs: LocalPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function useLocalPrefs() {
  const [prefs, setPrefsState] = useState<LocalPrefs>(loadPrefs)

  const setPrefs = useCallback((update: Partial<LocalPrefs>) => {
    setPrefsState(prev => {
      const next = { ...prev, ...update }
      savePrefs(next)
      return next
    })
  }, [])

  return { prefs, setPrefs }
}
