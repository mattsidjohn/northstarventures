import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { UpdatePropertyInput } from '@/types'

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: rowToProperty(data) })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const input = await request.json() as UpdatePropertyInput
    const { data: existing } = await supabase
      .from('properties')
      .select('id')
      .eq('id', id)
      .single()
    if (!existing) return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.name !== undefined)                  updates.name = input.name
    if (input.address !== undefined)               updates.address = input.address
    if (input.propertyType !== undefined)          updates.property_type = input.propertyType
    if (input.units !== undefined)                 updates.units = input.units
    if (input.sqft !== undefined)                  updates.sqft = input.sqft
    if (input.acquisitionDate !== undefined)       updates.acquisition_date = input.acquisitionDate
    if (input.purchasePrice !== undefined)         updates.purchase_price = input.purchasePrice
    if (input.estimatedCurrentValue !== undefined) updates.estimated_current_value = input.estimatedCurrentValue
    if (input.notes !== undefined)                 updates.notes = input.notes
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: rowToProperty(data) })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: { id } })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
