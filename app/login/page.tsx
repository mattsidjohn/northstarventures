'use client'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setConfirmed(true)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    }

    setLoading(false)
  }

  const toggle = () => {
    setMode(m => m === 'signin' ? 'signup' : 'signin')
    setError(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F2F2F7' }}>
      <div className="w-full max-w-sm px-4">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[12px] bg-brand-500 flex items-center justify-center shadow">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div>
            <p className="text-[17px] font-bold text-gray-900 leading-tight">North Star Ventures</p>
            <p className="text-xs text-gray-400 font-medium">Property Portfolio Manager</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.06] p-6">

          {confirmed ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-emerald-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-[15px] font-semibold text-gray-900 mb-1">Check your email</h2>
              <p className="text-sm text-gray-500">
                We sent a confirmation link to{' '}
                <span className="font-medium text-gray-700">{email}</span>.
                Click it to activate your account, then sign in.
              </p>
              <button
                onClick={() => { setConfirmed(false); setMode('signin') }}
                className="mt-5 text-sm text-brand-500 hover:text-brand-600 font-medium"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-[17px] font-semibold text-gray-900 mb-1">
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                {mode === 'signin' ? 'Access your property portfolio' : 'Set up your North Star account'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition disabled:opacity-50"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full bg-brand-500 text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-brand-600 transition disabled:opacity-50"
                >
                  {loading
                    ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                    : (mode === 'signin' ? 'Sign in' : 'Create account')}
                </button>
              </form>

              {error && (
                <p className="mt-3 text-xs text-red-600 text-center">{error}</p>
              )}

              <p className="mt-5 text-center text-sm text-gray-400">
                {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                {' '}
                <button onClick={toggle} className="text-brand-500 hover:text-brand-600 font-medium">
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
