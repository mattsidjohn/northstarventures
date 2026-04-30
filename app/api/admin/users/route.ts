import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, SUPER_ADMIN_EMAIL } from '@/lib/supabase/admin-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    const users = (data.users ?? []).map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.user_metadata?.first_name ?? null,
      lastName: u.user_metadata?.last_name ?? null,
      company: u.user_metadata?.company ?? null,
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
    }))

    return NextResponse.json({ success: true, data: users })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
