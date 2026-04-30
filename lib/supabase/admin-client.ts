import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export const SUPER_ADMIN_EMAIL = 'mattsidjohn@gmail.com'

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function getEffectiveUser(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const impersonateId = request.headers.get('x-impersonate-user-id')
  if (impersonateId && user.email === SUPER_ADMIN_EMAIL) {
    return { supabase: createAdminClient(), userId: impersonateId, isImpersonating: true }
  }

  return { supabase, userId: user.id, isImpersonating: false }
}
