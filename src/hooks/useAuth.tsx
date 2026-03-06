import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { ensureMember } from '../services/membersService'

// Keep existing hook behavior but ensure we call ensureMember whenever a user signs up or signs in.
export const AuthContext = createContext<{ user: User | null }>({ user: null })

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const currentUser = session?.user ?? null
      setUser(currentUser)

      // If a user is present on initial load (e.g., just signed in or after email confirmation), ensure membership
      if (currentUser?.id) {
        ensureMember(currentUser.id)
      }
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null
      setUser(newUser)

      // When a user signs in or completes confirmation, ensure they have a members row
      if (newUser?.id) {
        ensureMember(newUser.id)
        // Friendly toast on first time signin could be added, but keep it unobtrusive
        if (event === 'SIGNED_IN') {
          toast.success('Welcome — your membership was created')
        }
      }

      // Optionally show a toast for sign out or other events
      if (event === 'SIGNED_OUT') {
        toast('Signed out')
      }
    })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
