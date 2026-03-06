import { supabase } from './supabaseClient'
import { Entry } from '../models'
import { toCSVBlob } from '../utils/csv'

type SupaResp<T> = Promise<{ data: T | null; error: any }>

export interface ReportFilters {
  from?: string
  to?: string
  memberId?: string
}

export interface MonthSummary {
  month: string
  count: number
}

export async function fetchEntriesForReport(filters: ReportFilters = {}): SupaResp<Entry[]> {
  let query = supabase
    .from('entries')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.from) {
    query = query.gte('created_at', filters.from)
  }
  if (filters.to) {
    query = query.lte('created_at', filters.to)
  }
  if (filters.memberId) {
    query = query.eq('member_id', filters.memberId)
  }

  const { data, error } = await query
  return { data: data ?? null, error }
}

export function summarizeByMonth(entries: Entry[]): MonthSummary[] {
  const map = new Map<string, number>()

  for (const entry of entries) {
    const date = new Date(entry.created_at)
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    map.set(month, (map.get(month) ?? 0) + 1)
  }

  return Array.from(map.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export async function exportEntriesCSVBlob(
  filters: ReportFilters = {},
): Promise<{ blob: Blob | null; error: any }> {
  const { data: entries, error } = await fetchEntriesForReport(filters)

  if (error || !entries) {
    return { blob: null, error }
  }

  const rows = entries.map((e) => ({
    id: e.id,
    title: e.title,
    body: e.body ?? '',
    member_id: e.member_id,
    created_at: e.created_at,
    updated_at: e.updated_at,
    updated_by: e.updated_by ?? '',
    deleted_at: e.deleted_at ?? '',
  }))

  const blob = toCSVBlob(rows)
  return { blob, error: null }
}
