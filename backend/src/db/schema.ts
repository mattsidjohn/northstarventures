import Database from 'better-sqlite3'

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      property_type TEXT NOT NULL,
      units INTEGER NOT NULL DEFAULT 1,
      sqft REAL,
      acquisition_date TEXT,
      purchase_price REAL NOT NULL DEFAULT 0,
      estimated_current_value REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS monthly_data (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      income REAL NOT NULL DEFAULT 0,
      expenses REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(property_id, year, month)
    );

    CREATE TABLE IF NOT EXISTS scorecards (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      period TEXT NOT NULL,
      financial_score REAL NOT NULL,
      financial_factors TEXT NOT NULL DEFAULT '[]',
      operational_score REAL NOT NULL,
      operational_factors TEXT NOT NULL DEFAULT '[]',
      investment_score REAL NOT NULL,
      investment_factors TEXT NOT NULL DEFAULT '[]',
      strategic_score REAL NOT NULL DEFAULT 3,
      strategic_factors TEXT NOT NULL DEFAULT '[]',
      overall_score REAL NOT NULL,
      interpretation TEXT NOT NULL,
      recommended_decision TEXT NOT NULL,
      decision_reasons TEXT NOT NULL DEFAULT '[]',
      user_decision_override TEXT,
      decision_notes TEXT,
      action_plan TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(property_id, year, period)
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      property_type TEXT NOT NULL DEFAULT 'single-family',
      units INTEGER NOT NULL DEFAULT 1,
      sqft REAL,
      purchase_price REAL NOT NULL DEFAULT 0,
      monthly_rent REAL NOT NULL DEFAULT 0,
      financing_type TEXT NOT NULL DEFAULT 'interest-only',
      interest_rate REAL NOT NULL DEFAULT 7,
      loan_amount REAL NOT NULL DEFAULT 0,
      pm_percent REAL NOT NULL DEFAULT 10,
      vacancy_pct REAL NOT NULL DEFAULT 5,
      maintenance_reserve_pct REAL NOT NULL DEFAULT 10,
      insurance_pct REAL NOT NULL DEFAULT 0.5,
      tax_pct REAL NOT NULL DEFAULT 1.2,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      converted_property_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  // Migrate existing deals tables that predate assumption columns
  const migrations = [
    `ALTER TABLE deals ADD COLUMN vacancy_pct REAL NOT NULL DEFAULT 5`,
    `ALTER TABLE deals ADD COLUMN maintenance_reserve_pct REAL NOT NULL DEFAULT 10`,
    `ALTER TABLE deals ADD COLUMN insurance_pct REAL NOT NULL DEFAULT 0.5`,
    `ALTER TABLE deals ADD COLUMN tax_pct REAL NOT NULL DEFAULT 1.2`,
  ]
  for (const sql of migrations) {
    try { db.exec(sql) } catch { /* column already exists */ }
  }
}
