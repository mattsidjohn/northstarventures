-- North Star Ventures — Initial PostgreSQL schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- Requires: Supabase project with Auth enabled

-- ── Properties ─────────────────────────────────────────────────────────────

CREATE TABLE properties (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  address          TEXT        NOT NULL,
  property_type    TEXT        NOT NULL,
  units            INTEGER     NOT NULL DEFAULT 1,
  sqft             REAL,
  acquisition_date TEXT,
  purchase_price   REAL        NOT NULL DEFAULT 0,
  estimated_current_value REAL NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON properties
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Monthly Data ────────────────────────────────────────────────────────────

CREATE TABLE monthly_data (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  year        INTEGER     NOT NULL,
  month       INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  income      REAL        NOT NULL DEFAULT 0,
  expenses    REAL        NOT NULL DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(property_id, year, month)
);

ALTER TABLE monthly_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON monthly_data
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Scorecards ──────────────────────────────────────────────────────────────

CREATE TABLE scorecards (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id           UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  year                  INTEGER     NOT NULL,
  period                TEXT        NOT NULL CHECK (period IN ('H1', 'H2')),
  financial_score       REAL        NOT NULL DEFAULT 0,
  financial_factors     JSONB       NOT NULL DEFAULT '[]',
  operational_score     REAL        NOT NULL DEFAULT 0,
  operational_factors   JSONB       NOT NULL DEFAULT '[]',
  investment_score      REAL        NOT NULL DEFAULT 0,
  investment_factors    JSONB       NOT NULL DEFAULT '[]',
  strategic_score       REAL        NOT NULL DEFAULT 3,
  strategic_factors     JSONB       NOT NULL DEFAULT '[]',
  overall_score         REAL        NOT NULL DEFAULT 0,
  interpretation        TEXT        NOT NULL DEFAULT 'Monitor',
  recommended_decision  TEXT        NOT NULL DEFAULT 'Monitor',
  decision_reasons      JSONB       NOT NULL DEFAULT '[]',
  user_decision_override TEXT,
  decision_notes        TEXT,
  action_plan           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(property_id, year, period)
);

ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON scorecards
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Deals ───────────────────────────────────────────────────────────────────

CREATE TABLE deals (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                     TEXT        NOT NULL,
  address                  TEXT        NOT NULL DEFAULT '',
  property_type            TEXT        NOT NULL DEFAULT 'single-family',
  units                    INTEGER     NOT NULL DEFAULT 1,
  sqft                     REAL,
  purchase_price           REAL        NOT NULL DEFAULT 0,
  monthly_rent             REAL        NOT NULL DEFAULT 0,
  financing_type           TEXT        NOT NULL DEFAULT 'interest-only',
  interest_rate            REAL        NOT NULL DEFAULT 7,
  loan_amount              REAL        NOT NULL DEFAULT 0,
  pm_percent               REAL        NOT NULL DEFAULT 10,
  vacancy_pct              REAL        NOT NULL DEFAULT 5,
  maintenance_reserve_pct  REAL        NOT NULL DEFAULT 10,
  insurance_pct            REAL        NOT NULL DEFAULT 0.5,
  tax_pct                  REAL        NOT NULL DEFAULT 1.2,
  notes                    TEXT,
  status                   TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted')),
  converted_property_id    UUID        REFERENCES properties(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON deals
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Helpful indexes ──────────────────────────────────────────────────────────

CREATE INDEX idx_monthly_data_property ON monthly_data(property_id, year, month);
CREATE INDEX idx_scorecards_property   ON scorecards(property_id, year, period);
CREATE INDEX idx_deals_user            ON deals(user_id, created_at DESC);
CREATE INDEX idx_properties_user       ON properties(user_id, name);
