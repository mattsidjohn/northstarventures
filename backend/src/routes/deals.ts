import { Router, Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import { getDb } from '../db/database'
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

router.get('/', (_req: Request, res: Response) => {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM deals ORDER BY created_at DESC')
    .all() as Record<string, unknown>[]
  res.json({ success: true, data: rows.map(rowToDeal) })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const input = req.body as CreateDealInput
  const now = new Date().toISOString()
  const id = uuid()

  db.prepare(`
    INSERT INTO deals (
      id, name, address, property_type, units, sqft,
      purchase_price, monthly_rent, financing_type, interest_rate, loan_amount, pm_percent,
      vacancy_pct, maintenance_reserve_pct, insurance_pct, tax_pct,
      notes, status, converted_property_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, input.name, input.address ?? '', input.propertyType ?? 'single-family',
    input.units ?? 1, input.sqft ?? null,
    input.purchasePrice ?? 0, input.monthlyRent ?? 0,
    input.financingType ?? 'interest-only', input.interestRate ?? 7,
    input.loanAmount ?? 0, input.pmPercent ?? 10,
    input.vacancyPct ?? 5, input.maintenanceReservePct ?? 10,
    input.insurancePct ?? 0.5, input.taxPct ?? 1.2,
    input.notes ?? null, input.status ?? 'active',
    input.convertedPropertyId ?? null, now, now
  )

  const saved = db.prepare('SELECT * FROM deals WHERE id = ?').get(id) as Record<string, unknown>
  res.status(201).json({ success: true, data: rowToDeal(saved) })
})

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const input = req.body as UpdateDealInput
  const now = new Date().toISOString()

  const existing = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!existing) return res.status(404).json({ success: false, error: 'Deal not found' })

  const merged = { ...rowToDeal(existing), ...input }

  db.prepare(`
    UPDATE deals SET
      name = ?, address = ?, property_type = ?, units = ?, sqft = ?,
      purchase_price = ?, monthly_rent = ?, financing_type = ?, interest_rate = ?,
      loan_amount = ?, pm_percent = ?,
      vacancy_pct = ?, maintenance_reserve_pct = ?, insurance_pct = ?, tax_pct = ?,
      notes = ?, status = ?, converted_property_id = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    merged.name, merged.address, merged.propertyType, merged.units, merged.sqft ?? null,
    merged.purchasePrice, merged.monthlyRent, merged.financingType, merged.interestRate,
    merged.loanAmount, merged.pmPercent,
    merged.vacancyPct ?? 5, merged.maintenanceReservePct ?? 10,
    merged.insurancePct ?? 0.5, merged.taxPct ?? 1.2,
    merged.notes ?? null, merged.status, merged.convertedPropertyId ?? null,
    now, req.params.id
  )

  const saved = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json({ success: true, data: rowToDeal(saved) })
})

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM deals WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ success: false, error: 'Deal not found' })
  db.prepare('DELETE FROM deals WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: { id: req.params.id } })
})

export default router
