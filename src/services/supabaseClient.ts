import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './supabaseMock'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// When both env vars are present, use the real Supabase client.
// Otherwise fall back to the in-memory mock so the app can be run and tested
// locally without a Supabase project.
//
// Previous behaviour (kept here for reference):
//   if (!supabaseUrl) throw new Error('REACT_APP_SUPABASE_URL is not configured')
//   if (!supabaseAnonKey) throw new Error('REACT_APP_SUPABASE_ANON_KEY is not configured')
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabaseClient] REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY is not set. ' +
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
