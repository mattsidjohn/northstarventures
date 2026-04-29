import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; monthId: string }> }) {
  try {
    const { id, monthId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { error } = await supabase
      .from('monthly_data')
      .delete()
      .eq('id', monthId)
      .eq('property_id', id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: { id: monthId } })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
