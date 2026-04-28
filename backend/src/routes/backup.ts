import { Router, Request, Response } from 'express'
import { getDb } from '../db/database'
import { BackupData } from '@northstar/shared-types'

const router = Router()

router.get('/export', (_req: Request, res: Response) => {
  const db = getDb()
  const properties = db.prepare('SELECT * FROM properties').all()
  const monthlyData = db.prepare('SELECT * FROM monthly_data').all()
  const scorecards = db.prepare('SELECT * FROM scorecards').all()

  const backup: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    properties,
    monthlyData,
    scorecards,
  }

  res.setHeader('Content-Disposition', `attachment; filename="northstar-backup-${new Date().toISOString().slice(0, 10)}.json"`)
  res.setHeader('Content-Type', 'application/json')
  res.json(backup)
})

router.post('/import', (req: Request, res: Response) => {
  const db = getDb()
  const backup = req.body as BackupData

  if (
    !backup.version ||
    !Array.isArray(backup.properties) ||
    !Array.isArray(backup.monthlyData) ||
    !Array.isArray(backup.scorecards)
  ) {
    return res.status(400).json({ success: false, error: 'Invalid backup format' })
  }

  const importAll = db.transaction(() => {
    db.prepare('DELETE FROM scorecards').run()
    db.prepare('DELETE FROM monthly_data').run()
    db.prepare('DELETE FROM properties').run()

    for (const prop of backup.properties as Record<string, unknown>[]) {
      db.prepare(`
        INSERT OR REPLACE INTO properties (
          id, name, address, property_type, units, sqft, acquisition_date,
          purchase_price, estimated_current_value, notes,
          created_at, updated_at
        ) VALUES (
          :id, :name, :address, :property_type, :units, :sqft, :acquisition_date,
          :purchase_price, :estimated_current_value, :notes,
          :created_at, :updated_at
        )
      `).run(prop)
    }

    for (const md of backup.monthlyData as Record<string, unknown>[]) {
      db.prepare(`
        INSERT OR REPLACE INTO monthly_data (
          id, property_id, year, month, income, expenses, notes, created_at, updated_at
        ) VALUES (
          :id, :property_id, :year, :month, :income, :expenses, :notes, :created_at, :updated_at
        )
      `).run(md)
    }

    for (const sc of backup.scorecards as Record<string, unknown>[]) {
      db.prepare(`INSERT OR REPLACE INTO scorecards VALUES (
        :id, :property_id, :year, :period,
        :financial_score, :financial_factors,
        :operational_score, :operational_factors,
        :investment_score, :investment_factors,
        :strategic_score, :strategic_factors,
        :overall_score, :interpretation,
        :recommended_decision, :decision_reasons,
        :user_decision_override, :decision_notes, :action_plan,
        :created_at, :updated_at
      )`).run(sc)
    }
  })

  importAll()

  res.json({
    success: true,
    data: {
      imported: {
        properties: backup.properties.length,
        monthlyData: backup.monthlyData.length,
        scorecards: backup.scorecards.length,
      },
    },
  })
})

export default router
