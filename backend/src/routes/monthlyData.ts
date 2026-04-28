import { Router, Request, Response } from 'express'
import { createUserClient } from '../lib/supabase'
import { CreateMonthlyDataInput } from '@northstar/shared-types'
import { rowToMonthlyData } from './monthlyDataHelpers'

const router = Router({ mergeParams: true })

router.get('/', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const { data, error } = await db
      .from('monthly_data')
      .select('*')
      .eq('property_id', req.params.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
    if (error) return res.status(500).json({ success: false, error: error.message })
    res.json({ success: true, data: (data ?? []).map(rowToMonthlyData) })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const input = req.body as CreateMonthlyDataInput

    // Check whether an entry already exists (determines 200 vs 201 response code)
    const { data: existing } = await db
      .from('monthly_data')
      .select('id')
      .eq('property_id', req.params.id)
      .eq('year', input.year)
      .eq('month', input.month)
      .maybeSingle()

    const { data, error } = await db
      .from('monthly_data')
      .upsert(
        {
          property_id: req.params.id,
          user_id: req.userId,
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

    if (error) return res.status(500).json({ success: false, error: error.message })
    res.status(existing ? 200 : 201).json({ success: true, data: rowToMonthlyData(data) })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.delete('/:monthId', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const { error } = await db
      .from('monthly_data')
      .delete()
      .eq('id', req.params.monthId)
      .eq('property_id', req.params.id)
    if (error) return res.status(500).json({ success: false, error: error.message })
    res.json({ success: true, data: { id: req.params.monthId } })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
