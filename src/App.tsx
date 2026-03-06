import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './services/supabaseClient'
import Entries from './pages/Entries'

// ─── Login Card ──────────────────────────────────────────────────────────────

function LoginCard({ onSignedIn }: { onSignedIn: (user: User) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else if (data.user) {
      onSignedIn(data.user)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ICO Renovation Ledger</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to continue</p>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        setUser(session?.user ?? null)
        setInitializing(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: unknown, session: Session | null) => {
        setUser(session?.user ?? null)
      },
    )

    return () => listener?.subscription?.unsubscribe()
  }, [])

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  if (!user) return <LoginCard onSignedIn={setUser} />

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 shadow">
        <div className="mx-auto max-w-5xl px-4 flex items-center justify-between h-14">
          <span className="text-white font-semibold text-lg tracking-tight">
            ICO Renovation Ledger
          </span>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-700/60 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/entries" element={<Entries />} />
          <Route path="*" element={<Navigate to="/entries" replace />} />
        </Routes>
      </main>
    </div>
  )
}
