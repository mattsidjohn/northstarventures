import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SEED_USER_ID = process.env.SEED_USER_ID
const reset = process.argv.includes('--reset')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SEED_USER_ID) {
  console.error('Missing env vars. Add to .env.local:\n  NEXT_PUBLIC_SUPABASE_URL\n  SUPABASE_SERVICE_ROLE_KEY\n  SEED_USER_ID')
  process.exit(1)
}

// Service role key bypasses RLS so we can seed for a specific user
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// ── Seed data ──────────────────────────────────────────────────────────────

type PropertySeed = {
  name: string
  address: string
  property_type: string
  units: number
  sqft?: number
  purchase_price: number
  estimated_current_value: number
  acquisition_date: string
  monthly: { income: number; expenses: number }
}

const PROPERTIES: PropertySeed[] = [
  {
    name: '702 S Main St',
    address: '702 S Main St, Springfield, MO 65806',
    property_type: 'commercial',
    units: 6,
    sqft: 6800,
    purchase_price: 800000,
    estimated_current_value: 920000,
    acquisition_date: '2019-03-15',
    monthly: { income: 23500, expenses: 17200 },
  },
  {
    name: '1301 S Virginia Ave',
    address: '1301 S Virginia Ave, Springfield, MO 65807',
    property_type: 'commercial',
    units: 2,
    sqft: 2400,
    purchase_price: 450000,
    estimated_current_value: 485000,
    acquisition_date: '2020-07-01',
    monthly: { income: 5400, expenses: 3940 },
  },
  {
    name: 'Middle West Building',
    address: '412 W Olive St, Springfield, MO 65806',
    property_type: 'mixed-use',
    units: 10,
    sqft: 9200,
    purchase_price: 650000,
    estimated_current_value: 700000,
    acquisition_date: '2020-11-20',
    monthly: { income: 8000, expenses: 5850 },
  },
  {
    name: '712 S Virginia Ave',
    address: '712 S Virginia Ave, Springfield, MO 65807',
    property_type: 'commercial',
    units: 1,
    sqft: 1800,
    purchase_price: 280000,
    estimated_current_value: 310000,
    acquisition_date: '2021-02-10',
    monthly: { income: 4000, expenses: 2630 },
  },
  {
    name: '1301 West Central St',
    address: '1301 W Central St, Springfield, MO 65802',
    property_type: 'single-family',
    units: 1,
    sqft: 1400,
    purchase_price: 165000,
    estimated_current_value: 182000,
    acquisition_date: '2021-06-05',
    monthly: { income: 1500, expenses: 1280 },
  },
  {
    name: '1008-1012 S Rouse Ave',
    address: '1008-1012 S Rouse Ave, Springfield, MO 65804',
    property_type: 'multi-unit',
    units: 3,
    sqft: 3200,
    purchase_price: 185000,
    estimated_current_value: 210000,
    acquisition_date: '2020-04-22',
    monthly: { income: 2200, expenses: 1740 },
  },
  {
    name: '2229-2231 Arizona Ave',
    address: '2229-2231 Arizona Ave, Springfield, MO 65807',
    property_type: 'duplex',
    units: 2,
    sqft: 2100,
    purchase_price: 175000,
    estimated_current_value: 200000,
    acquisition_date: '2019-09-14',
    monthly: { income: 1800, expenses: 1430 },
  },
  {
    name: '313-315 Ash Craft Ave',
    address: '313-315 Ash Craft Ave, Springfield, MO 65806',
    property_type: 'duplex',
    units: 2,
    sqft: 2000,
    purchase_price: 220000,
    estimated_current_value: 230000,
    acquisition_date: '2023-01-18',
    monthly: { income: 1900, expenses: 1800 },
  },
  {
    name: '515-517 Jefferson St',
    address: '515-517 Jefferson St, Springfield, MO 65806',
    property_type: 'duplex',
    units: 2,
    sqft: 2200,
    purchase_price: 195000,
    estimated_current_value: 212000,
    acquisition_date: '2021-08-30',
    monthly: { income: 1700, expenses: 1450 },
  },
  {
    name: 'Laurel Duplex — Unit A',
    address: '814-A E Laurel St, Springfield, MO 65806',
    property_type: 'duplex',
    units: 2,
    sqft: 1800,
    purchase_price: 140000,
    estimated_current_value: 155000,
    acquisition_date: '2020-02-28',
    monthly: { income: 1100, expenses: 1030 },
  },
  {
    name: 'Laurel Duplex — Unit B',
    address: '814-B E Laurel St, Springfield, MO 65806',
    property_type: 'duplex',
    units: 2,
    sqft: 1800,
    purchase_price: 140000,
    estimated_current_value: 155000,
    acquisition_date: '2020-02-28',
    monthly: { income: 1100, expenses: 1030 },
  },
  {
    name: 'Turk Duplex — Unit A',
    address: '622-A S Turk Ave, Springfield, MO 65804',
    property_type: 'duplex',
    units: 2,
    sqft: 1900,
    purchase_price: 150000,
    estimated_current_value: 168000,
    acquisition_date: '2020-10-07',
    monthly: { income: 1200, expenses: 1060 },
  },
  {
    name: 'Turk Duplex — Unit B',
    address: '622-B S Turk Ave, Springfield, MO 65804',
    property_type: 'duplex',
    units: 2,
    sqft: 1900,
    purchase_price: 150000,
    estimated_current_value: 168000,
    acquisition_date: '2020-10-07',
    monthly: { income: 1200, expenses: 1060 },
  },
  {
    name: 'Zora Duplex — Unit A',
    address: '508-A E Zora St, Springfield, MO 65803',
    property_type: 'duplex',
    units: 2,
    sqft: 2000,
    purchase_price: 160000,
    estimated_current_value: 178000,
    acquisition_date: '2021-04-12',
    monthly: { income: 1300, expenses: 1090 },
  },
  {
    name: 'Zora Duplex — Unit B',
    address: '508-B E Zora St, Springfield, MO 65803',
    property_type: 'duplex',
    units: 2,
    sqft: 2000,
    purchase_price: 160000,
    estimated_current_value: 178000,
    acquisition_date: '2021-04-12',
    monthly: { income: 1300, expenses: 1090 },
  },
]

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  if (reset) {
    console.log('Resetting existing seed data for user…')
    await db.from('scorecards').delete().eq('user_id', SEED_USER_ID!)
    await db.from('monthly_data').delete().eq('user_id', SEED_USER_ID!)
    await db.from('properties').delete().eq('user_id', SEED_USER_ID!)
    console.log('Reset complete.')
  }

  const { data: existing } = await db
    .from('properties')
    .select('id')
    .eq('user_id', SEED_USER_ID!)
    .limit(1)

  if (existing && existing.length > 0 && !reset) {
    console.log('Data already exists for this user. Run with --reset to re-seed.')
    process.exit(0)
  }

  console.log(`Seeding ${PROPERTIES.length} properties…`)

  for (const prop of PROPERTIES) {
    const { monthly, ...propData } = prop

    const { data: inserted, error } = await db
      .from('properties')
      .insert({
        user_id: SEED_USER_ID,
        name: propData.name,
        address: propData.address,
        property_type: propData.property_type,
        units: propData.units,
        sqft: propData.sqft ?? null,
        purchase_price: propData.purchase_price,
        estimated_current_value: propData.estimated_current_value,
        acquisition_date: propData.acquisition_date,
      })
      .select('id')
      .single()

    if (error || !inserted) {
      console.error(`  x ${prop.name}: ${error?.message}`)
      continue
    }

    // Insert 3 months of data: Jan, Feb, Mar 2026
    for (const month of [1, 2, 3]) {
      // Add minor month-to-month variance (+-3%)
      const variance = 1 + (Math.random() * 0.06 - 0.03)
      await db.from('monthly_data').insert({
        user_id: SEED_USER_ID,
        property_id: inserted.id,
        year: 2026,
        month,
        income: Math.round(monthly.income * variance),
        expenses: Math.round(monthly.expenses * variance),
      })
    }

    console.log(`  ok ${prop.name}`)
  }

  console.log('\nSeed complete.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
