'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { MonthlyData, CreateMonthlyDataInput } from '@/types'
import { MONTH_NAMES, formatCurrency } from '@/utils/format'

interface RowState {
  income: string
  expenses: string
  saving: boolean
  saved: boolean
  error: string | null
}

export interface MonthlyHistoryTableProps {
  monthlyData: MonthlyData[]
  onSave: (input: CreateMonthlyDataInput) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export default function MonthlyHistoryTable({ monthlyData, onSave, onDelete }: MonthlyHistoryTableProps) {
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(monthlyData.map(e => [
      e.id,
      { income: String(e.income), expenses: String(e.expenses), saving: false, saved: false, error: null },
    ]))
  )
  const rowsRef = useRef(rows)
  rowsRef.current = rows

  // Add newly-arrived entries; remove deleted ones; never overwrite in-progress edits
  useEffect(() => {
    setRows(prev => {
      const existingIds = new Set(monthlyData.map(e => e.id))
      const next: Record<string, RowState> = {}
      for (const entry of monthlyData) {
        next[entry.id] = prev[entry.id] ?? {
          income: String(entry.income),
          expenses: String(entry.expenses),
          saving: false,
          saved: false,
          error: null,
        }
      }
      // Keep any rows mid-save that aren't in the new list yet
      for (const [id, state] of Object.entries(prev)) {
        if (!existingIds.has(id) && state.saving) next[id] = state
      }
      return next
    })
  }, [monthlyData])

  const blurTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const saveRow = useCallback(async (entry: MonthlyData) => {
    const state = rowsRef.current[entry.id]
    if (!state || state.saving || state.saved) return

    const income = parseFloat(state.income) || 0
    const expenses = parseFloat(state.expenses) || 0
    if (income === entry.income && expenses === entry.expenses) return

    setRows(prev => ({ ...prev, [entry.id]: { ...prev[entry.id], saving: true, error: null } }))
    try {
      await onSave({ propertyId: entry.propertyId, year: entry.year, month: entry.month, income, expenses })
      setRows(prev => ({ ...prev, [entry.id]: { ...prev[entry.id], saving: false, saved: true } }))
      setTimeout(() => setRows(prev => ({ ...prev, [entry.id]: { ...prev[entry.id], saved: false } })), 700)
    } catch {
      setRows(prev => ({ ...prev, [entry.id]: { ...prev[entry.id], saving: false, error: 'Save failed' } }))
    }
  }, [onSave])

  const handleBlur = useCallback((entry: MonthlyData) => {
    blurTimers.current[entry.id] = setTimeout(() => {
      const active = document.activeElement
      if (active?.id !== `income-${entry.id}` && active?.id !== `expenses-${entry.id}`) {
        saveRow(entry)
      }
    }, 120)
  }, [saveRow])

  const clearBlurTimer = useCallback((id: string) => {
    clearTimeout(blurTimers.current[id])
  }, [])

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    entry: MonthlyData,
    field: 'income' | 'expenses',
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveRow(entry)
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      clearBlurTimer(entry.id)
      const idx = monthlyData.findIndex(d => d.id === entry.id)

      if (!e.shiftKey) {
        if (field === 'income') {
          document.getElementById(`expenses-${entry.id}`)?.focus()
        } else {
          saveRow(entry)
          const next = monthlyData[idx + 1]
          if (next) setTimeout(() => document.getElementById(`income-${next.id}`)?.focus(), 30)
        }
      } else {
        if (field === 'expenses') {
          document.getElementById(`income-${entry.id}`)?.focus()
        } else {
          const prev = monthlyData[idx - 1]
          if (prev) setTimeout(() => document.getElementById(`expenses-${prev.id}`)?.focus(), 30)
        }
      }
    }
  }, [monthlyData, saveRow, clearBlurTimer])

  if (monthlyData.length === 0) {
    return <p className="text-sm text-gray-400 py-4">No monthly data entered yet.</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl shadow-card">
      <p className="text-[10px] text-gray-400 px-4 pt-3 pb-1">Tab to advance · Enter to save · auto-saves when you leave a row</p>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {['Month', 'Income', 'Expenses', 'Cash Flow', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {monthlyData.map(entry => {
            const state = rows[entry.id]
            if (!state) return null
            const liveIncome = parseFloat(state.income) || 0
            const liveExpenses = parseFloat(state.expenses) || 0
            const cashFlow = liveIncome - liveExpenses

            return (
              <tr
                key={entry.id}
                className={`group transition-colors ${state.saved ? 'bg-emerald-50' : state.saving ? 'bg-sky-50/40' : ''}`}
              >
                <td className="px-4 py-2 font-medium text-gray-700 whitespace-nowrap select-none">
                  {MONTH_NAMES[entry.month - 1]} {entry.year}
                </td>

                <td className="px-3 py-1.5">
                  <input
                    id={`income-${entry.id}`}
                    type="number"
                    value={state.income}
                    onChange={e => setRows(prev => ({ ...prev, [entry.id]: { ...prev[entry.id], income: e.target.value } }))}
                    onFocus={() => clearBlurTimer(entry.id)}
                    onBlur={() => handleBlur(entry)}
                    onKeyDown={e => handleKeyDown(e, entry, 'income')}
                    disabled={state.saving || state.saved}
                    className="w-32 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 tabular-nums bg-white disabled:opacity-50 transition-colors"
                  />
                </td>

                <td className="px-3 py-1.5">
                  <input
                    id={`expenses-${entry.id}`}
                    type="number"
                    value={state.expenses}
                    onChange={e => setRows(prev => ({ ...prev, [entry.id]: { ...prev[entry.id], expenses: e.target.value } }))}
                    onFocus={() => clearBlurTimer(entry.id)}
                    onBlur={() => handleBlur(entry)}
                    onKeyDown={e => handleKeyDown(e, entry, 'expenses')}
                    disabled={state.saving || state.saved}
                    className="w-32 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 tabular-nums bg-white disabled:opacity-50 transition-colors"
                  />
                </td>

                <td className={`px-4 py-2 font-medium tabular-nums ${cashFlow < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {formatCurrency(cashFlow)}
                </td>

                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-2 min-h-[28px]">
                    {state.saving && <span className="text-xs text-gray-400">Saving…</span>}
                    {state.saved && <span className="text-xs font-medium text-emerald-600">✓ Saved</span>}
                    {state.error && <span className="text-xs text-red-500">{state.error}</span>}
                    {onDelete && !state.saving && !state.saved && (
                      <button
                        onClick={() => onDelete(entry.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
