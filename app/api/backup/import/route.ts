import { NextRequest, NextResponse } from 'next/server'
import { getEffectiveUser } from '@/lib/supabase/admin-client'

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  for (const line of text.trim().split('\n')) {
    const fields: string[] = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (c === ',' && !inQ) {
        fields.push(cur); cur = ''
      } else {
        cur += c
      }
    }
    fields.push(cur)
    rows.push(fields)
  }
  return rows
}

const REQUIRED_COLS = ['property_id', 'property_name', 'address', 'property_type', 'units', 'purchase_price']

export async function POST(request: NextRequest) {
  try {
    const ctx = await getEffectiveUser(request)
    if (!ctx) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { supabase, userId } = ctx

    const csvText = await request.text()
    const rows = parseCsv(csvText)
    if (rows.length < 2) {
      return NextResponse.json({ success: false, error: 'CSV is empty or missing data rows' }, { status: 400 })
    }

    const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\r/g, ''))
    const col = (row: string[], name: string) => (row[headers.indexOf(name)] ?? '').trim()

    for (const h of REQUIRED_COLS) {
      if (!headers.includes(h)) {
        return NextResponse.json({ success: false, error: `Missing required column: ${h}` }, { status: 400 })
      }
    }

    // Group rows by property_id; collect monthly rows separately
    type PropEntry = { fields: Record<string, string>; monthly: Record<string, string>[] }
    const propMap = new Map<string, PropEntry>()

    for (const row of rows.slice(1)) {
      if (row.every(f => f.trim() === '')) continue
      const id = col(row, 'property_id')
      if (!id) continue

      const fieldMap = Object.fromEntries(headers.map((h, i) => [h, (row[i] ?? '').trim()]))

      if (!propMap.has(id)) {
        propMap.set(id, { fields: fieldMap, monthly: [] })
      }

      const year = col(row, 'year')
      const month = col(row, 'month')
      const income = col(row, 'income')
      const expenses = col(row, 'expenses')
      if (year && month && income !== '' && expenses !== '') {
        propMap.get(id)!.monthly.push(fieldMap)
      }
    }

    if (propMap.size === 0) {
      return NextResponse.json({ success: false, error: 'No valid property rows found in CSV' }, { status: 400 })
    }

    // Full replace — delete in dependency order
    await supabase.from('scorecards').delete().eq('user_id', userId)
    await supabase.from('monthly_data').delete().eq('user_id', userId)
    await supabase.from('properties').delete().eq('user_id', userId)

    let propCount = 0
    let monthlyCount = 0

    for (const { fields, monthly } of Array.from(propMap.values())) {
      const { data: inserted, error: propErr } = await supabase
        .from('properties')
        .insert({
          user_id: userId,
          name: fields.property_name,
          address: fields.address,
          property_type: fields.property_type,
          units: parseInt(fields.units) || 1,
          sqft: fields.sqft ? parseInt(fields.sqft) : null,
          acquisition_date: fields.acquisition_date || null,
          purchase_price: parseFloat(fields.purchase_price) || 0,
          estimated_current_value: parseFloat(fields.estimated_current_value) || 0,
          notes: fields.notes || null,
        })
        .select('id')
        .single()

      if (propErr || !inserted) continue
      propCount++

      for (const md of monthly) {
        const year = parseInt(md.year)
        const month = parseInt(md.month)
        const income = parseFloat(md.income)
        const expenses = parseFloat(md.expenses)
        if (!year || !month || isNaN(income) || isNaN(expenses)) continue

        await supabase.from('monthly_data').insert({
          user_id: userId,
          property_id: inserted.id,
          year,
          month,
          income,
          expenses,
          notes: md.notes || null,
        })
        monthlyCount++
      }
    }

    return NextResponse.json({
      success: true,
      data: { imported: { properties: propCount, monthlyData: monthlyCount } },
    })
  } catch (err) {
    console.error('CSV import failed:', err)
    return NextResponse.json({ success: false, error: 'Import failed — check CSV format and try again' }, { status: 500 })
  }
}
