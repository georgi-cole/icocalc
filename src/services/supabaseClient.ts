import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl) throw new Error('REACT_APP_SUPABASE_URL is not configured')
if (!supabaseAnonKey) throw new Error('REACT_APP_SUPABASE_ANON_KEY is not configured')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
