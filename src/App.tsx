import React, { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from './services/supabaseClient'
import { AuthProvider } from './hooks/useAuth'
import EntriesList from './pages/Entries/EntriesList'
import EntryForm from './pages/Entries/EntryForm'
import Reports from './pages/Reports'
import Audit from './pages/Audit'
import toast from 'react-hot-toast'

// ─── Login Card ──────────────────────────────────────────────────────────────

function LoginCard({ onSignedIn }: { onSignedIn: (user: User) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else if (data.user) {
      onSignedIn(data.user)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ICO Renovation Ledger</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to continue</p>
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

// ─── Navigation Shell ─────────────────────────────────────────────────────────

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700/60'
  }`

function Shell({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-blue-600 shadow">
        <div className="mx-auto max-w-5xl px-4 flex items-center justify-between h-14">
          <span className="text-white font-semibold text-lg tracking-tight">
            ICO Renovation Ledger
          </span>
          <div className="flex items-center gap-2">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/entries" className={navLinkClass}>
              Entries
            </NavLink>
            <NavLink to="/reports" className={navLinkClass}>
              Reports
            </NavLink>
            <NavLink to="/audit" className={navLinkClass}>
              Audit
            </NavLink>
            <button
              onClick={onSignOut}
              className="ml-3 px-3 py-1.5 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-700/60 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <div className="max-w-3xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome</h1>
                <p className="text-gray-600">
                  Signed in as <span className="font-medium text-gray-800">{user.email}</span>.
                </p>
                <p className="mt-4 text-gray-600">
                  Use the navigation above to view and manage renovation ledger entries.
                </p>
              </div>
            }
          />
          <Route path="/entries" element={<EntriesList />} />
          <Route path="/entries/new" element={<EntryForm />} />
          <Route path="/entries/:id/edit" element={<EntryForm />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user ?? null)
      setInitializing(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
      },
    )

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [navigate])

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <LoginCard onSignedIn={setUser} />
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    toast('Signed out')
  }

  return (
    <AuthProvider>
      <Shell user={user} onSignOut={handleSignOut} />
    </AuthProvider>
  )
}
