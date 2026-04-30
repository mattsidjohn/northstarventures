import { NextRequest, NextResponse } from 'next/server'
import { getEffectiveUser } from '@/lib/supabase/admin-client'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; monthId: string }> }) {
  try {
    const { id, monthId } = await params
    const ctx = await getEffectiveUser(request)
    if (!ctx) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { supabase, userId } = ctx
    const { error } = await supabase
      .from('monthly_data')
      .delete()
      .eq('id', monthId)
      .eq('property_id', id)
      .eq('user_id', userId)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: { id: monthId } })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
