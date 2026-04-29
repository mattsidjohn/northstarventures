'use client'

import { useState, ReactNode } from 'react'

export interface ColumnDef<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  sortValue?: (row: T) => number | string
  className?: string
}

export interface SortableTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export default function SortableTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyMessage = 'No data available',
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const col = columns.find(c => c.key === sortKey)
    if (!col?.sortValue) return 0
    const va = col.sortValue(a)
    const vb = col.sortValue(b)
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortDir === 'asc' ? va - vb : vb - va
    }
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va))
  })

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl shadow-card">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${
                  col.sortValue ? 'cursor-pointer select-none hover:text-gray-800' : ''
                } ${col.className ?? ''}`}
                onClick={() => col.sortValue && handleSort(col.key)}
              >
                {col.header}
                {sortKey === col.key && (
                  <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {sorted.map(row => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
            >
              {columns.map(col => (
                <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
