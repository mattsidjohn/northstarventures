import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/database'
import { CreatePropertyInput, UpdatePropertyInput } from '@northstar/shared-types'
import { rowToProperty } from './propertyHelpers'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM properties ORDER BY name ASC').all() as Record<string, unknown>[]
  res.json({ success: true, data: rows.map(rowToProperty) })
})

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!row) return res.status(404).json({ success: false, error: 'Property not found' })
  res.json({ success: true, data: rowToProperty(row) })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const input = req.body as CreatePropertyInput
  const now = new Date().toISOString()
  const id = uuidv4()

  db.prepare(`
    INSERT INTO properties (
      id, name, address, property_type, units, sqft, acquisition_date,
      purchase_price, estimated_current_value, notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, input.name, input.address, input.propertyType, input.units,
    input.sqft ?? null, input.acquisitionDate ?? null,
    input.purchasePrice ?? 0, input.estimatedCurrentValue ?? 0, input.notes ?? null,
    now, now
  )

  const created = db.prepare('SELECT * FROM properties WHERE id = ?').get(id) as Record<string, unknown>
  res.status(201).json({ success: true, data: rowToProperty(created) })
})

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!existing) return res.status(404).json({ success: false, error: 'Property not found' })

  const input = req.body as UpdatePropertyInput
  const now = new Date().toISOString()

  db.prepare(`
    UPDATE properties SET
      name = COALESCE(?, name),
      address = COALESCE(?, address),
      property_type = COALESCE(?, property_type),
      units = COALESCE(?, units),
      sqft = COALESCE(?, sqft),
      acquisition_date = COALESCE(?, acquisition_date),
      purchase_price = COALESCE(?, purchase_price),
      estimated_current_value = COALESCE(?, estimated_current_value),
      notes = COALESCE(?, notes),
      updated_at = ?
    WHERE id = ?
  `).run(
    input.name ?? null, input.address ?? null, input.propertyType ?? null,
    input.units ?? null, input.sqft ?? null, input.acquisitionDate ?? null,
    input.purchasePrice ?? null, input.estimatedCurrentValue ?? null, input.notes ?? null,
    now, req.params.id
  )

  const updated = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json({ success: true, data: rowToProperty(updated) })
})

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM properties WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ success: false, error: 'Property not found' })
  db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: { id: req.params.id } })
})

export default router
