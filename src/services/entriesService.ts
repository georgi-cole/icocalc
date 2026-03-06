import { supabase } from './supabaseClient'
import { Entry, EntryInsert, EntryUpdate } from '../models'

type SupaResp<T> = Promise<{ data: T | null; error: any }>

export async function fetchEntries(): SupaResp<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return { data: data ?? null, error }
}

export async function fetchEntryById(id: string): SupaResp<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single()
  return { data: data ?? null, error }
}

export async function createEntry(entry: EntryInsert): SupaResp<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .insert(entry)
    .select()
    .single()
  return { data: data ?? null, error }
}

export async function updateEntry(id: string, updates: EntryUpdate): SupaResp<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data: data ?? null, error }
}

export async function softDeleteEntry(id: string): SupaResp<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data: data ?? null, error }
}

export async function restoreEntry(id: string): SupaResp<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .update({ deleted_at: null })
    .eq('id', id)
    .select()
    .single()
  return { data: data ?? null, error }
}

export async function fetchDeletedEntries(): SupaResp<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  return { data: data ?? null, error }
}
