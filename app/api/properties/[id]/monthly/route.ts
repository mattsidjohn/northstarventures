import { NextRequest, NextResponse } from 'next/server'
import { getEffectiveUser } from '@/lib/supabase/admin-client'
import { CreateMonthlyDataInput } from '@/types'

function rowToMonthlyData(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    year: row.year as number,
    month: row.month as number,
    income: row.income as number,
    expenses: row.expenses as number,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getEffectiveUser(request)
    if (!ctx) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { supabase, userId } = ctx
    const { data, error } = await supabase
      .from('monthly_data')
      .select('*')
      .eq('property_id', id)
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: (data ?? []).map(rowToMonthlyData) })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getEffectiveUser(request)
    if (!ctx) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { supabase, userId } = ctx
    const input = await request.json() as CreateMonthlyDataInput
    const { data: existing } = await supabase
      .from('monthly_data')
      .select('id')
      .eq('property_id', id)
      .eq('user_id', userId)
      .eq('year', input.year)
      .eq('month', input.month)
      .maybeSingle()
    const { data, error } = await supabase
      .from('monthly_data')
      .upsert(
        {
          property_id: id,
          user_id: userId,
          year: input.year,
          month: input.month,
          income: input.income ?? 0,
          expenses: input.expenses ?? 0,
          notes: input.notes ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'property_id,year,month' }
      )
      .select()
      .single()
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: rowToMonthlyData(data) }, { status: existing ? 200 : 201 })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
