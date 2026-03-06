import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './supabaseMock'

// Vite exposes env vars via import.meta.env.VITE_* at build time.
// For local development, copy .env.example to .env.local and fill in values.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// When both env vars are present, use the real Supabase client.
// Otherwise fall back to the in-memory mock so the app can be run and tested
// locally without a Supabase project.
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabaseClient] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
      'Running in MOCK MODE with in-memory data. ' +
      'Set these variables in .env.local to connect to a real Supabase project.',
  )
}

// Export either the real client or the mock, typed as `any` so all service
// modules can call it without additional type gymnastics.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : mockSupabase
