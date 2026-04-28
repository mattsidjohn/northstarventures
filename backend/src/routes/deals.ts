import { Router, Request, Response } from 'express'
import { createUserClient } from '../lib/supabase'
import { Deal, CreateDealInput, UpdateDealInput } from '@northstar/shared-types'

const router = Router()

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

router.get('/', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const { data, error } = await db
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ success: false, error: error.message })
    res.json({ success: true, data: (data ?? []).map(rowToDeal) })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const input = req.body as CreateDealInput

    const { data, error } = await db
      .from('deals')
      .insert({
        user_id: req.userId,
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

    if (error) return res.status(500).json({ success: false, error: error.message })
    res.status(201).json({ success: true, data: rowToDeal(data) })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const input = req.body as UpdateDealInput

    const { data: existing, error: fetchErr } = await db
      .from('deals')
      .select('*')
      .eq('id', req.params.id)
      .single()
    if (fetchErr || !existing) return res.status(404).json({ success: false, error: 'Deal not found' })

    const merged = { ...rowToDeal(existing), ...input }

    const { data, error } = await db
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
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: error.message })
    res.json({ success: true, data: rowToDeal(data) })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const { error } = await db
      .from('deals')
      .delete()
      .eq('id', req.params.id)
    if (error) return res.status(500).json({ success: false, error: error.message })
    res.json({ success: true, data: { id: req.params.id } })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
