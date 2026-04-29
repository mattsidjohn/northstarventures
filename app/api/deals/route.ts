import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Deal, CreateDealInput } from '@/types'

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

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: (data ?? []).map(rowToDeal) })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const input = await request.json() as CreateDealInput
    const { data, error } = await supabase
      .from('deals')
      .insert({
        user_id: user.id,
        name: input.name,
        address: input.address ?? '',
        property_type: input.propertyType ?? 'single-family',
        units: input.units ?? 1,
        sqft: input.sqft ?? null,
        purchase_price: input.purchasePrice ?? 0,
        monthly_rent: input.monthlyRent ?? 0,
        financing_type: input.financingType ?? 'interest-only',
        interest_rate: input.interestRate ?? 7,
        loan_amount: input.loanAmount ?? 0,
        pm_percent: input.pmPercent ?? 10,
        vacancy_pct: input.vacancyPct ?? 5,
        maintenance_reserve_pct: input.maintenanceReservePct ?? 10,
        insurance_pct: input.insurancePct ?? 0.5,
        tax_pct: input.taxPct ?? 1.2,
        notes: input.notes ?? null,
        status: input.status ?? 'active',
        converted_property_id: input.convertedPropertyId ?? null,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: rowToDeal(data) }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
