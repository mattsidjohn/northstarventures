import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/database'
import { CreateMonthlyDataInput } from '@northstar/shared-types'
import { rowToMonthlyData } from './monthlyDataHelpers'

const router = Router({ mergeParams: true })

router.get('/', (req: Request, res: Response) => {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM monthly_data WHERE property_id = ? ORDER BY year DESC, month DESC')
    .all(req.params.id) as Record<string, unknown>[]
  res.json({ success: true, data: rows.map(rowToMonthlyData) })
})

router.post('/', (req: Request, res: Response) => {
  const db = getDb()
  const input = req.body as CreateMonthlyDataInput
  const now = new Date().toISOString()

  const existing = db
    .prepare('SELECT id FROM monthly_data WHERE property_id = ? AND year = ? AND month = ?')
    .get(req.params.id, input.year, input.month) as { id: string } | undefined

  const id = existing?.id ?? uuidv4()

  db.prepare(`
    INSERT INTO monthly_data (id, property_id, year, month, income, expenses, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(property_id, year, month) DO UPDATE SET
      income = excluded.income,
      expenses = excluded.expenses,
      notes = excluded.notes,
      updated_at = excluded.updated_at
  `).run(
    id, req.params.id, input.year, input.month,
    input.income ?? 0, input.expenses ?? 0,
    input.notes ?? null, now, now
  )

  const saved = db.prepare('SELECT * FROM monthly_data WHERE id = ?').get(id) as Record<string, unknown>
  res.status(existing ? 200 : 201).json({ success: true, data: rowToMonthlyData(saved) })
})

router.delete('/:monthId', (req: Request, res: Response) => {
  const db = getDb()
  db.prepare('DELETE FROM monthly_data WHERE id = ? AND property_id = ?').run(
    req.params.monthId, req.params.id
  )
  res.json({ success: true, data: { id: req.params.monthId } })
})

export default router
