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
  `)
}
