import { Router, Request, Response } from 'express'
import { createUserClient } from '../lib/supabase'
import { CreatePropertyInput, UpdatePropertyInput } from '@northstar/shared-types'
import { rowToProperty } from './propertyHelpers'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const { data, error } = await db
      .from('properties')
      .select('*')
      .order('name', { ascending: true })
    if (error) return res.status(500).json({ success: false, error: error.message })
    res.json({ success: true, data: (data ?? []).map(rowToProperty) })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const { data, error } = await db
      .from('properties')
      .select('*')
      .eq('id', req.params.id)
      .single()
    if (error || !data) return res.status(404).json({ success: false, error: 'Property not found' })
    res.json({ success: true, data: rowToProperty(data) })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const input = req.body as CreatePropertyInput

    const { data, error } = await db
      .from('properties')
      .insert({
        user_id: req.userId,
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

    if (error) return res.status(500).json({ success: false, error: error.message })
    res.status(201).json({ success: true, data: rowToProperty(data) })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const input = req.body as UpdatePropertyInput

    // Verify the property exists and belongs to this user (RLS enforces the latter)
    const { data: existing } = await db
      .from('properties')
      .select('id')
      .eq('id', req.params.id)
      .single()
    if (!existing) return res.status(404).json({ success: false, error: 'Property not found' })

    // Build update object — only include fields present in the request
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.name !== undefined)                 updates.name = input.name
    if (input.address !== undefined)              updates.address = input.address
    if (input.propertyType !== undefined)         updates.property_type = input.propertyType
    if (input.units !== undefined)                updates.units = input.units
    if (input.sqft !== undefined)                 updates.sqft = input.sqft
    if (input.acquisitionDate !== undefined)      updates.acquisition_date = input.acquisitionDate
    if (input.purchasePrice !== undefined)        updates.purchase_price = input.purchasePrice
    if (input.estimatedCurrentValue !== undefined) updates.estimated_current_value = input.estimatedCurrentValue
    if (input.notes !== undefined)                updates.notes = input.notes

    const { data, error } = await db
      .from('properties')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: error.message })
    res.json({ success: true, data: rowToProperty(data) })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const { error } = await db
      .from('properties')
      .delete()
      .eq('id', req.params.id)
    if (error) return res.status(500).json({ success: false, error: error.message })
    res.json({ success: true, data: { id: req.params.id } })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
