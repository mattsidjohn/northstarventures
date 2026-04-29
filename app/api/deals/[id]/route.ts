import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Deal, UpdateDealInput } from '@/types'

function rowToDeal(row: Record<string, unknown>): Deal {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    propertyType: row.property_type as Deal['propertyType'],
    units: row.units as number,
    sqft: row.sqft as number | undefined,
    purchasePrice: row.purchase_price as number,
    monthlyRent: row.monthly_rent as number,
    financingType: row.financing_type as Deal['financingType'],
    interestRate: row.interest_rate as number,
    loanAmount: row.loan_amount as number,
    pmPercent: row.pm_percent as number,
    vacancyPct: (row.vacancy_pct as number) ?? 5,
    maintenanceReservePct: (row.maintenance_reserve_pct as number) ?? 10,
    insurancePct: (row.insurance_pct as number) ?? 0.5,
    taxPct: (row.tax_pct as number) ?? 1.2,
    notes: row.notes as string | undefined,
    status: row.status as Deal['status'],
    convertedPropertyId: row.converted_property_id as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const input = await request.json() as UpdateDealInput
    const { data: existing, error: fetchErr } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchErr || !existing) return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 })
    const merged = { ...rowToDeal(existing), ...input }
    const { data, error } = await supabase
      .from('deals')
      .update({
        name: merged.name,
        address: merged.address,
        property_type: merged.propertyType,
        units: merged.units,
        sqft: merged.sqft ?? null,
        purchase_price: merged.purchasePrice,
        monthly_rent: merged.monthlyRent,
        financing_type: merged.financingType,
        interest_rate: merged.interestRate,
        loan_amount: merged.loanAmount,
        pm_percent: merged.pmPercent,
        vacancy_pct: merged.vacancyPct ?? 5,
        maintenance_reserve_pct: merged.maintenanceReservePct ?? 10,
        insurance_pct: merged.insurancePct ?? 0.5,
        tax_pct: merged.taxPct ?? 1.2,
        notes: merged.notes ?? null,
        status: merged.status,
        converted_property_id: merged.convertedPropertyId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: rowToDeal(data) })
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
      .from('deals')
      .delete()
      .eq('id', id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: { id } })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
