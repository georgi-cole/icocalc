import { supabase } from './supabaseClient'

/**
 * Ensure a membership row exists for the given user_id.
 * - Safe to call repeatedly (idempotent check first).
 * - Uses the anonymous client; relies on RLS policy `members_can_insert_own`.
 */
export async function ensureMember(userId: string, role = 'user') {
  if (!userId) return

  try {
    // Check for an existing member row first to keep this idempotent and avoid unique constraint errors
    const { data: existing, error: selectError } = await supabase
      .from('members')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (selectError) {
      // Non-fatal: log and continue to attempt insert. Do not throw to avoid surfacing internal errors to the UI.
      // eslint-disable-next-line no-console
      console.warn('membersService.ensureMember: select error', selectError)
    }

    if (existing && existing.length > 0) return

    const { error: insertError } = await supabase.from('members').insert({
      user_id: userId,
      role,
    })

    if (insertError) {
      // Log for server-side observability; do not throw a raw error to UI.
      // eslint-disable-next-line no-console
      console.warn('membersService.ensureMember: insert error', insertError)
    }
  } catch (err) {
    // Defensive catch-all
    // eslint-disable-next-line no-console
    console.warn('membersService.ensureMember: unexpected error', err)
  }
}
