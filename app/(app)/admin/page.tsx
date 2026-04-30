'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import PageContainer from '@/components/layout/PageContainer'
import { useAuth } from '@/context/AuthContext'
import { useImpersonation } from '@/context/ImpersonationContext'

const SUPER_ADMIN_EMAIL = 'mattsidjohn@gmail.com'

interface AdminUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  company: string | null
  createdAt: string
  lastSignIn: string | null
}

export default function AdminPage() {
  const { user } = useAuth()
  const { impersonating, startImpersonating, stopImpersonating } = useImpersonation()
  const router = useRouter()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  useEffect(() => {
    if (!isSuperAdmin) return
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(json => {
        if (json.success) setUsers(json.data)
        else setError(json.error)
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }, [isSuperAdmin])

  if (!isSuperAdmin) {
    return (
      <div>
        <Header title="Admin" />
        <PageContainer>
          <p className="text-sm text-gray-500 mt-8 text-center">Access denied.</p>
        </PageContainer>
      </div>
    )
  }

  function fmt(dateStr: string | null) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div>
      <Header
        title="Super Admin"
        subtitle={`${users.length} users`}
        actions={
          impersonating ? (
            <button
              onClick={() => { stopImpersonating(); router.push('/dashboard') }}
              className="px-4 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors"
            >
              Stop Impersonating
            </button>
          ) : undefined
        }
      />
      <PageContainer>
        {loading ? (
          <p className="text-sm text-gray-400 mt-8 text-center">Loading users…</p>
        ) : error ? (
          <p className="text-sm text-red-500 mt-8 text-center">{error}</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['User', 'Company', 'Joined', 'Last Sign In', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => {
                  const isActive = impersonating?.userId === u.id
                  const isSelf = u.email === SUPER_ADMIN_EMAIL
                  return (
                    <tr key={u.id} className={`transition-colors ${isActive ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                          {isSelf && <span className="ml-2 text-[10px] font-bold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded-full">You</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.company || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt(u.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt(u.lastSignIn)}</td>
                      <td className="px-4 py-3">
                        {isSelf ? null : isActive ? (
                          <button
                            onClick={() => { stopImpersonating(); router.push('/dashboard') }}
                            className="text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Stop
                          </button>
                        ) : (
                          <button
                            onClick={() => { startImpersonating(u.id, u.email ?? ''); router.push('/dashboard') }}
                            className="text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Impersonate
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
