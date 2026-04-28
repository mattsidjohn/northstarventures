import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY — copy backend/.env.example to backend/.env')
}

// Shared client for token validation only (no session persistence)
const _authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Validates a Supabase access token and returns the user's ID, or null if invalid. */
export async function validateToken(token: string): Promise<string | null> {
  const { data: { user }, error } = await _authClient.auth.getUser(token)
  if (error || !user) return null
  return user.id
}

/**
 * Creates a Supabase client scoped to the authenticated user.
 * RLS policies (auth.uid() = user_id) apply automatically to all queries.
 */
export function createUserClient(userToken: string) {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
