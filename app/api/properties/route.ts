import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { CreatePropertyInput } from '@/types'

function rowToProperty(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    propertyType: row.property_type as string,
    units: row.units as number,
    sqft: row.sqft as number | undefined,
    acquisitionDate: row.acquisition_date as string | undefined,
    purchasePrice: row.purchase_price as number,
    estimatedCurrentValue: row.estimated_current_value as number,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('name', { ascending: true })
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: (data ?? []).map(rowToProperty) })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const input = await request.json() as CreatePropertyInput
    const { data, error } = await supabase
      .from('properties')
      .insert({
        user_id: user.id,
        name: input.name,
        address: input.address,
        property_type: input.propertyType,
        units: input.units ?? 1,
        sqft: input.sqft ?? null,
        acquisition_date: input.acquisitionDate ?? null,
        purchase_price: input.purchasePrice ?? 0,
        estimated_current_value: input.estimatedCurrentValue ?? 0,
        notes: input.notes ?? null,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: rowToProperty(data) }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
