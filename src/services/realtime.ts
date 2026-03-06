import { supabase } from './supabaseClient'
import { Entry } from '../models'

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimeEntryEvent {
  eventType: RealtimeEventType
  entry: Entry | null
  oldEntry: Entry | null
}

export interface RealtimeSubscription {
  unsubscribe: () => void
}

export function subscribeToEntries(
  onEvent: (event: RealtimeEntryEvent) => void,
): RealtimeSubscription {
  const channel = supabase
    .channel('public:entries')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'entries' },
      (payload: any) => {
        const eventType: RealtimeEventType = payload.eventType
        // Defensive: handle multiple payload shapes from Supabase Realtime
        const entry: Entry | null = payload.new ?? payload.record ?? null
        const oldEntry: Entry | null = payload.old ?? payload.old_record ?? null
        onEvent({ eventType, entry, oldEntry })
      },
    )
    .subscribe()

  return {
    unsubscribe: () => {
      channel.unsubscribe()
    },
  }
}
