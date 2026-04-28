import { Router, Request, Response } from 'express'
import { createUserClient } from '../lib/supabase'
import { BackupData } from '@northstar/shared-types'

const router = Router()

router.get('/export', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)

    // RLS ensures each query returns only the current user's data
    const [propResult, monthlyResult, scorecardResult] = await Promise.all([
      db.from('properties').select('*').order('created_at'),
      db.from('monthly_data').select('*').order('created_at'),
      db.from('scorecards').select('*').order('created_at'),
    ])

    const backup: BackupData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      properties: propResult.data ?? [],
      monthlyData: monthlyResult.data ?? [],
      scorecards: scorecardResult.data ?? [],
    }

    res.setHeader('Content-Disposition', `attachment; filename="northstar-backup-${new Date().toISOString().slice(0, 10)}.json"`)
    res.setHeader('Content-Type', 'application/json')
    res.json(backup)
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/import', async (req: Request, res: Response) => {
  try {
    const db = createUserClient(req.userToken)
    const backup = req.body as BackupData

    if (
      !backup.version ||
      !Array.isArray(backup.properties) ||
      !Array.isArray(backup.monthlyData) ||
      !Array.isArray(backup.scorecards)
    ) {
      return res.status(400).json({ success: false, error: 'Invalid backup format' })
    }

    // Delete existing user data in dependency order (scorecards → monthly → properties → deals)
    // RLS limits these deletes to only the current user's rows
    await db.from('scorecards').delete().eq('user_id', req.userId)
    await db.from('monthly_data').delete().eq('user_id', req.userId)
    await db.from('properties').delete().eq('user_id', req.userId)
    await db.from('deals').delete().eq('user_id', req.userId)

    // Re-insert with current user's user_id (overrides any user_id from the backup)
    for (const prop of backup.properties as Record<string, unknown>[]) {
      await db.from('properties').insert({
        id: prop.id,
        user_id: req.userId,
        name: prop.name,
        address: prop.address,
        property_type: prop.property_type,
        units: prop.units,
        sqft: prop.sqft ?? null,
        acquisition_date: prop.acquisition_date ?? null,
        purchase_price: prop.purchase_price,
        estimated_current_value: prop.estimated_current_value,
        notes: prop.notes ?? null,
        created_at: prop.created_at,
        updated_at: prop.updated_at,
      })
    }

    for (const md of backup.monthlyData as Record<string, unknown>[]) {
      await db.from('monthly_data').insert({
        id: md.id,
        user_id: req.userId,
        property_id: md.property_id,
        year: md.year,
        month: md.month,
        income: md.income,
        expenses: md.expenses,
        notes: md.notes ?? null,
        created_at: md.created_at,
        updated_at: md.updated_at,
      })
    }

    for (const sc of backup.scorecards as Record<string, unknown>[]) {
      // factors may be arrays (Supabase JSONB export) or strings (legacy SQLite backup)
      const parseField = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v ?? [])
      await db.from('scorecards').insert({
        id: sc.id,
        user_id: req.userId,
        property_id: sc.property_id,
        year: sc.year,
        period: sc.period,
        financial_score: sc.financial_score,
        financial_factors: parseField(sc.financial_factors),
        operational_score: sc.operational_score ?? 0,
        operational_factors: parseField(sc.operational_factors),
        investment_score: sc.investment_score ?? 0,
        investment_factors: parseField(sc.investment_factors),
        strategic_score: sc.strategic_score ?? 3,
        strategic_factors: parseField(sc.strategic_factors),
        overall_score: sc.overall_score,
        interpretation: sc.interpretation,
        recommended_decision: sc.recommended_decision,
        decision_reasons: parseField(sc.decision_reasons),
        user_decision_override: sc.user_decision_override ?? null,
        decision_notes: sc.decision_notes ?? null,
        action_plan: sc.action_plan ?? null,
        created_at: sc.created_at,
        updated_at: sc.updated_at,
      })
    }

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
  } catch (err) {
    console.error('Backup import failed:', err)
    res.status(500).json({ success: false, error: 'Import failed — check backup format and try again' })
  }
})

export default router
