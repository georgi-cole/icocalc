import { supabase } from './supabaseClient'

export interface AuditRow {
  id: string
  table_name: string
  record_id: string
  actor_id: string | null
  action: string
  payload: {
    old?: Record<string, unknown> | null
    new?: Record<string, unknown> | null
    [key: string]: unknown
  } | null
  created_at: string
}

export interface AuditFilters {
  tableName?: string
  actorId?: string
  recordId?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

type SupaResp<T> = Promise<{ data: T | null; error: any }>

const DEFAULT_LIMIT = 50

export async function fetchAuditLog(filters: AuditFilters = {}): SupaResp<AuditRow[]> {
  let query = supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.tableName) {
    query = query.eq('table_name', filters.tableName)
  }
  if (filters.actorId) {
    query = query.eq('actor_id', filters.actorId)
  }
  if (filters.recordId) {
    query = query.eq('record_id', filters.recordId)
  }
  if (filters.from) {
    query = query.gte('created_at', filters.from)
  }
  if (filters.to) {
    query = query.lte('created_at', filters.to)
  }

  const limit = filters.limit ?? DEFAULT_LIMIT
  if (filters.offset !== undefined) {
    query = query.range(filters.offset, filters.offset + limit - 1)
  } else {
    query = query.limit(limit)
  }

  const { data, error } = await query
  return { data: data ?? null, error }
}

export async function fetchEntryHistory(recordId: string): SupaResp<AuditRow[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('record_id', recordId)
    .order('created_at', { ascending: false })
  return { data: data ?? null, error }
}

export async function restoreFromAudit(recordId: string): SupaResp<unknown> {
  const { data: rows, error: fetchError } = await supabase
    .from('audit_log')
    .select('*')
    .eq('record_id', recordId)
    .in('action', ['INSERT', 'UPDATE'])
    .order('created_at', { ascending: false })
    .limit(50)

  if (fetchError) return { data: null, error: fetchError }

  const suitable = (rows ?? []).find((row: AuditRow) => {
    const p = row.payload
    return p && p.new && typeof p.new === 'object' && Object.keys(p.new).length > 0
  }) as AuditRow | undefined

  if (!suitable || !suitable.payload?.new) {
    return {
      data: null,
      error: { message: 'No suitable audit payload found to restore from.' },
    }
  }

  const { data, error } = await supabase
    .from('entries')
    .upsert(suitable.payload.new as Record<string, unknown>)
    .select()
    .limit(1)

  return { data: data ?? null, error }
}
