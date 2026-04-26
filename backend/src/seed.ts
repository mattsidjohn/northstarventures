/**
 * Seeder for North Star Ventures property data.
 * Bank payments (interest) are baked into the expenses figure for each monthly record.
 * All properties were modeled at 5.75% interest-only when computing seed expenses.
 *
 * Usage: npm run seed            (skip if data exists)
 *        npm run seed:reset      (clear and re-seed)
 */

import { getDb } from './db/database'
import { v4 as uuidv4 } from 'uuid'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(n: number): number {
  return Math.round(n * 100) / 100
}

function parseYearMonth(s: string): { year: number; month: number } {
  const [y, m] = s.split('-').map(Number)
  return { year: y, month: m }
}

// ---------------------------------------------------------------------------
// Property definitions
// ---------------------------------------------------------------------------

interface PropertySeed {
  name: string
  address: string
  propertyType: 'single-family' | 'duplex' | 'multi-unit' | 'commercial' | 'mixed-use'
  units: number
  sqft?: number
  acquisitionDate: string
  purchasePrice: number
  estimatedCurrentValue: number
  notes?: string
  monthlyRecords: { month: string; income: number; expenses: number }[]
}

// Expenses include operating costs + 5.75% IO interest on purchase price
// interest = purchasePrice * 0.0575 / 12

const PROPERTIES: PropertySeed[] = [
  {
    name: '1008-1012 S Rouse',
    address: '1008-1012 S Rouse, Springfield, MO',
    propertyType: 'multi-unit',
    units: 3,
    sqft: 2400,
    acquisitionDate: '2021-03-15',
    purchasePrice: 170000,
    estimatedCurrentValue: 230000,
    notes: '3-unit multi-family. Stable long-term tenants.',
    monthlyRecords: [
      { month: '2026-01', income: 2220.00, expenses: 1750.00 },
      { month: '2026-02', income: 2220.00, expenses: 1750.00 },
      { month: '2026-03', income: 2220.00, expenses: 1750.00 },
    ],
  },
  {
    name: '1301 S Virginia',
    address: '1301 S Virginia Ave, Springfield, MO',
    propertyType: 'commercial',
    units: 2,
    sqft: 3200,
    acquisitionDate: '2022-06-01',
    purchasePrice: 340000,
    estimatedCurrentValue: 385000,
    notes: 'Commercial property with 2 tenant spaces. Strong cash flow.',
    monthlyRecords: [
      { month: '2026-01', income: 5400.00, expenses: 3115.63 },
      { month: '2026-02', income: 5400.00, expenses: 3115.63 },
      { month: '2026-03', income: 5400.00, expenses: 3115.63 },
    ],
  },
  {
    name: '2229-2231 Arizona Ave',
    address: '2229-2231 Arizona Ave, Springfield, MO',
    propertyType: 'duplex',
    units: 2,
    sqft: 1800,
    acquisitionDate: '2019-08-15',
    purchasePrice: 120000,
    estimatedCurrentValue: 250000,
    notes: 'Duplex acquired early in portfolio. Significant equity built.',
    monthlyRecords: [
      { month: '2026-01', income: 1825.00, expenses: 1074.13 },
      { month: '2026-02', income: 1825.00, expenses: 1074.13 },
      { month: '2026-03', income: 1825.00, expenses: 1074.13 },
    ],
  },
  {
    name: '313-315 Ash Craft',
    address: '313-315 Ash Craft Blvd, Springfield, MO',
    propertyType: 'duplex',
    units: 2,
    sqft: 2200,
    acquisitionDate: '2023-04-01',
    purchasePrice: 305000,
    estimatedCurrentValue: 325000,
    notes: 'Recently acquired duplex. Higher debt service relative to income — monitor closely.',
    monthlyRecords: [
      { month: '2026-01', income: 2100.00, expenses: 1863.92 },
      { month: '2026-02', income: 2100.00, expenses: 1863.71 },
      { month: '2026-03', income: 2100.00, expenses: 1863.71 },
    ],
  },
  {
    name: '515-517 Jefferson St',
    address: '515-517 Jefferson St, Springfield, MO',
    propertyType: 'duplex',
    units: 2,
    sqft: 1900,
    acquisitionDate: '2022-01-10',
    purchasePrice: 180000,
    estimatedCurrentValue: 215000,
    notes: 'Stable duplex. Modest cash flow after debt service.',
    monthlyRecords: [
      { month: '2026-01', income: 1650.00, expenses: 1339.59 },
      { month: '2026-02', income: 1650.00, expenses: 1339.59 },
      { month: '2026-03', income: 1650.00, expenses: 1339.59 },
    ],
  },
  {
    name: '702 S Main ST',
    address: '702 S Main St, Springfield, MO',
    propertyType: 'commercial',
    units: 6,
    sqft: 8500,
    acquisitionDate: '2018-05-01',
    purchasePrice: 1400000,
    estimatedCurrentValue: 2100000,
    notes: 'Flagship commercial property. Long-term commercial tenant. Highest income asset in portfolio. NNN-structured lease.',
    monthlyRecords: [
      { month: '2026-01', income: 23500.00, expenses: 6165.02 },
      { month: '2026-02', income: 23500.00, expenses: 6165.02 },
      { month: '2026-03', income: 23500.00, expenses: 6165.02 },
    ],
  },
  {
    name: '712 S Virginia',
    address: '712 S Virginia Ave, Springfield, MO',
    propertyType: 'commercial',
    units: 1,
    sqft: 2800,
    acquisitionDate: '2021-09-15',
    purchasePrice: 225000,
    estimatedCurrentValue: 300000,
    notes: 'Single commercial unit. Strong income relative to purchase price.',
    monthlyRecords: [
      { month: '2026-01', income: 4000.00, expenses: 1149.53 },
      { month: '2026-02', income: 4000.00, expenses: 1149.53 },
      { month: '2026-03', income: 4000.00, expenses: 1149.53 },
    ],
  },
  {
    name: 'Laurel Duplex - Unit 1',
    address: 'Laurel Duplex Unit 1, Springfield, MO',
    propertyType: 'duplex',
    units: 2,
    sqft: 900,
    acquisitionDate: '2020-07-01',
    purchasePrice: 225000,
    estimatedCurrentValue: 260000,
    notes: 'Half of Laurel Duplex split into separate tracking entities. Low cash flow — watchlist candidate.',
    monthlyRecords: [
      { month: '2026-01', income: 1550.00, expenses: 1401.30 },
      { month: '2026-02', income: 1550.00, expenses: 1401.30 },
      { month: '2026-03', income: 1550.00, expenses: 1401.30 },
    ],
  },
  {
    name: 'Laurel Duplex - Unit 2',
    address: 'Laurel Duplex Unit 2, Springfield, MO',
    propertyType: 'duplex',
    units: 2,
    sqft: 900,
    acquisitionDate: '2020-07-01',
    purchasePrice: 225000,
    estimatedCurrentValue: 260000,
    notes: 'Half of Laurel Duplex split into separate tracking entities. Low cash flow — watchlist candidate.',
    monthlyRecords: [
      { month: '2026-01', income: 1550.00, expenses: 1401.30 },
      { month: '2026-02', income: 1550.00, expenses: 1401.30 },
      { month: '2026-03', income: 1550.00, expenses: 1401.30 },
    ],
  },
  {
    name: 'Middle West Building',
    address: 'Middle West Building, Springfield, MO',
    propertyType: 'mixed-use',
    units: 10,
    sqft: 9200,
    acquisitionDate: '2022-11-01',
    purchasePrice: 340000,
    estimatedCurrentValue: 950000,
    notes: 'Mixed-use building with residential and retail units. Good scale.',
    monthlyRecords: [
      { month: '2026-01', income: 7995.00, expenses: 4985.30 },
      { month: '2026-02', income: 7995.00, expenses: 4985.30 },
      { month: '2026-03', income: 7995.00, expenses: 4985.30 },
    ],
  },
  {
    name: 'Turk Duplex - Unit 1',
    address: 'Turk Duplex Unit 1, Springfield, MO',
    propertyType: 'duplex',
    units: 2,
    sqft: 850,
    acquisitionDate: '2020-03-01',
    purchasePrice: 200000,
    estimatedCurrentValue: 235000,
    notes: 'Half of Turk Duplex tracked separately. Adequate cash flow.',
    monthlyRecords: [
      { month: '2026-01', income: 1612.50, expenses: 1319.28 },
      { month: '2026-02', income: 1612.50, expenses: 1319.28 },
      { month: '2026-03', income: 1612.50, expenses: 1319.28 },
    ],
  },
  {
    name: 'Turk Duplex - Unit 2',
    address: 'Turk Duplex Unit 2, Springfield, MO',
    propertyType: 'duplex',
    units: 2,
    sqft: 850,
    acquisitionDate: '2020-03-01',
    purchasePrice: 200000,
    estimatedCurrentValue: 235000,
    notes: 'Half of Turk Duplex tracked separately. Adequate cash flow.',
    monthlyRecords: [
      { month: '2026-01', income: 1612.50, expenses: 1319.28 },
      { month: '2026-02', income: 1612.50, expenses: 1319.28 },
      { month: '2026-03', income: 1612.50, expenses: 1319.28 },
    ],
  },
  {
    name: 'Zora Duplex - Unit 1',
    address: 'Zora Duplex Unit 1, Springfield, MO',
    propertyType: 'duplex',
    units: 2,
    sqft: 850,
    acquisitionDate: '2020-03-01',
    purchasePrice: 200000,
    estimatedCurrentValue: 240000,
    notes: 'Half of Zora Duplex tracked separately. Slightly better margins than Turk.',
    monthlyRecords: [
      { month: '2026-01', income: 1662.50, expenses: 1330.78 },
      { month: '2026-02', income: 1662.50, expenses: 1330.78 },
      { month: '2026-03', income: 1662.50, expenses: 1330.78 },
    ],
  },
  {
    name: 'Zora Duplex - Unit 2',
    address: 'Zora Duplex Unit 2, Springfield, MO',
    propertyType: 'duplex',
    units: 2,
    sqft: 850,
    acquisitionDate: '2020-03-01',
    purchasePrice: 200000,
    estimatedCurrentValue: 240000,
    notes: 'Half of Zora Duplex tracked separately. Slightly better margins than Turk.',
    monthlyRecords: [
      { month: '2026-01', income: 1662.50, expenses: 1330.78 },
      { month: '2026-02', income: 1662.50, expenses: 1330.78 },
      { month: '2026-03', income: 1662.50, expenses: 1330.78 },
    ],
  },
]

// ---------------------------------------------------------------------------
// Seeder
// ---------------------------------------------------------------------------

function seed() {
  const db = getDb()
  const reset = process.argv.includes('--reset')

  const existing = (db.prepare('SELECT COUNT(*) as c FROM properties').get() as { c: number }).c

  if (existing > 0 && !reset) {
    console.log(`ℹ️  Database already has ${existing} properties. Run with --reset to clear and re-seed.`)
    process.exit(0)
  }

  if (existing > 0 && reset) {
    db.prepare('DELETE FROM scorecards').run()
    db.prepare('DELETE FROM monthly_data').run()
    db.prepare('DELETE FROM properties').run()
    console.log('🗑  Cleared existing data.')
  }

  const insertAll = db.transaction(() => {
    for (const prop of PROPERTIES) {
      const propId = uuidv4()
      const now = new Date().toISOString()

      db.prepare(`
        INSERT INTO properties (
          id, name, address, property_type, units, sqft, acquisition_date,
          purchase_price, estimated_current_value, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        propId, prop.name, prop.address, prop.propertyType, prop.units,
        prop.sqft ?? null, prop.acquisitionDate,
        prop.purchasePrice, prop.estimatedCurrentValue, prop.notes ?? null,
        now, now
      )

      for (const rec of prop.monthlyRecords) {
        const { year, month } = parseYearMonth(rec.month)
        const monthId = uuidv4()
        const cashFlow = round(rec.income - rec.expenses)

        db.prepare(`
          INSERT INTO monthly_data (id, property_id, year, month, income, expenses, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(monthId, propId, year, month, rec.income, rec.expenses, null, now, now)

        if (prop.monthlyRecords[0] === rec) {
          console.log(
            `  ✓ ${prop.name.padEnd(30)} | Income: $${rec.income.toFixed(0).padStart(6)} | Expenses: $${rec.expenses.toFixed(0).padStart(6)} | CF: $${cashFlow.toFixed(0).padStart(6)}`
          )
        }
      }
    }
  })

  console.log('\n📦 Seeding North Star Ventures...\n')
  insertAll()
  console.log(`\n✅ Done. Seeded ${PROPERTIES.length} properties with ${PROPERTIES.reduce((s, p) => s + p.monthlyRecords.length, 0)} monthly records.\n`)
}

seed()
