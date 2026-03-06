/**
 * Serverless function: restore-entry
 *
 * Restores a soft-deleted entry by clearing its deleted_at timestamp.
 *
 * Required environment variables (set in your hosting platform, e.g. Netlify / Vercel):
 *   SUPABASE_URL              — your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service-role key (bypasses RLS; keep this secret)
 *
 * Expected request body (JSON):
 *   { "id": "<entry-uuid>" }
 *
 * Response (JSON):
 *   200 { "data": <restored entry row> }
 *   400 { "error": "Missing entry id" }
 *   405 { "error": "Method not allowed" }
 *   500 { "error": "<message>" }
 */

// @ts-check
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * NOTE: This template assumes Netlify Functions handler shape, but can be adapted
 * for Vercel (use `req`/`res`) or AWS Lambda (use `event`/`callback`) with
 * minimal changes.
 *
 * @param {{ httpMethod: string, body: string|null }} event
 * @returns {Promise<{ statusCode: number, body: string }>}
 */
exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error(
      'restore-entry: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable is not set.',
    )
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server misconfiguration: missing environment variables' }),
    }
  }

  let id
  try {
    const body = JSON.parse(event.body || '{}')
    id = body.id
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    }
  }

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing entry id' }),
    }
  }

  // Use the service-role client so the operation bypasses RLS.
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data, error } = await supabase
    .from('entries')
    .update({ deleted_at: null })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('restore-entry: Supabase error', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ data }),
  }
}
