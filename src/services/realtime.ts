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

const INITIAL_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 30_000
const BACKOFF_MULTIPLIER = 2

export function subscribeToEntries(
  onEvent: (event: RealtimeEntryEvent) => void,
): RealtimeSubscription {
  let stopped = false
  let backoffMs = INITIAL_BACKOFF_MS
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let currentChannel: ReturnType<typeof supabase.channel> | null = null

  function attach() {
    if (stopped) return

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
      .subscribe((status: string, _err?: Error) => {
        if (status === 'SUBSCRIBED') {
          // Successfully subscribed — reset backoff
          backoffMs = INITIAL_BACKOFF_MS
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (stopped) return
          // Safely remove the broken channel before reconnecting
          supabase.removeChannel(channel).catch(() => {
            // Ignore removal errors; channel may already be gone
          })
          currentChannel = null
          // Schedule a reconnect with exponential backoff
          retryTimer = setTimeout(() => {
            if (!stopped) attach()
          }, backoffMs)
          backoffMs = Math.min(backoffMs * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS)
        }
      })

    currentChannel = channel
  }

  attach()

  return {
    unsubscribe: () => {
      stopped = true
      if (retryTimer !== null) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      if (currentChannel !== null) {
        supabase.removeChannel(currentChannel).catch(() => {
          // Ignore removal errors on teardown
        })
        currentChannel = null
      }
    },
  }
}
