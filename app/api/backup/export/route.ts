import { createClient } from '@/lib/supabase/server'

function csvCell(value: string | number | null | undefined): string {
  const s = String(value ?? '')
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvRow(...fields: (string | number | null | undefined)[]): string {
  return fields.map(csvCell).join(',')
}

const HEADERS = [
  'property_id', 'property_name', 'address', 'property_type',
  'units', 'sqft', 'acquisition_date', 'purchase_price', 'estimated_current_value', 'notes',
  'year', 'month', 'income', 'expenses',
].join(',')

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const [propResult, monthlyResult] = await Promise.all([
      supabase.from('properties').select('*').order('name'),
      supabase.from('monthly_data').select('*').order('year').order('month'),
    ])

    const properties = propResult.data ?? []
    const monthly = monthlyResult.data ?? []

    // Index monthly data by property id
    const byProp: Record<string, typeof monthly> = {}
    for (const md of monthly) {
      if (!byProp[md.property_id]) byProp[md.property_id] = []
      byProp[md.property_id].push(md)
    }

    const lines: string[] = [HEADERS]

    for (const p of properties) {
      const entries = byProp[p.id] ?? []
      const propFields = [p.id, p.name, p.address, p.property_type, p.units, p.sqft, p.acquisition_date, p.purchase_price, p.estimated_current_value, p.notes] as const

      if (entries.length === 0) {
        lines.push(csvRow(...propFields, '', '', '', ''))
      } else {
        for (const md of entries) {
          lines.push(csvRow(...propFields, md.year, md.month, md.income, md.expenses))
        }
      }
    }

    const filename = `northstar-${new Date().toISOString().slice(0, 10)}.csv`
    return new Response(lines.join('\n'), {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'text/csv; charset=utf-8',
      },
    })
  } catch {
    return new Response('Internal server error', { status: 500 })
  }
}
