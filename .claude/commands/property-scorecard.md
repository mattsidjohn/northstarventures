# North Star Ventures Property Scorecard — App Skill

## Purpose

You are helping build and maintain the North Star Ventures property management application. This is a full-stack local app for tracking rental property performance, generating semi-annual scorecards, and supporting investment decision-making.

The primary user is the owner/operator of North Star Ventures. The app helps answer:
- Which properties are performing well vs. dragging down cash flow?
- Which properties need operational attention?
- Should a property be held, monitored, or sold?
- What is the portfolio's projected annual income and cash flow?

---

## Tech Stack

- **Monorepo** with 3 workspaces: `backend/`, `frontend/`, `packages/shared-types/`
- **Backend**: Express + TypeScript + SQLite (better-sqlite3), port 3001
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS, port 5173
- **Shared types**: `@northstar/shared-types` consumed by both sides
- **Dev**: `npm run dev` from root starts both via `concurrently`
- **Database**: `northstar.db` SQLite file at project root, WAL mode, foreign keys enabled

---

## Data Model

### Property (`packages/shared-types/src/property.types.ts`)

```typescript
type PropertyType = 'single-family' | 'duplex' | 'multi-unit' | 'commercial' | 'mixed-use'

interface Property {
  id: string
  name: string
  address: string
  propertyType: PropertyType
  units: number
  sqft?: number
  acquisitionDate?: string
  purchasePrice: number
  estimatedCurrentValue: number
  notes?: string
  createdAt: string
  updatedAt: string
}

type CreatePropertyInput = Omit<Property, 'id' | 'createdAt' | 'updatedAt'>
type UpdatePropertyInput = Partial<CreatePropertyInput>
```

### Monthly Data (`packages/shared-types/src/monthly.types.ts`)

Monthly entry captures total income and total expenses only. No granular line items.

```typescript
interface MonthlyData {
  id: string
  propertyId: string
  year: number
  month: number
  income: number
  expenses: number
  notes?: string
  createdAt: string
  updatedAt: string
}
```

### Metrics (`packages/shared-types/src/metrics.types.ts`)

```typescript
interface SemiAnnualMetrics {
  period: 'H1' | 'H2'
  year: number
  monthsWithData: number
  totals: { income: number; expenses: number; cashFlow: number }
  averages: { monthlyIncome: number; monthlyCashFlow: number }
}

interface InvestmentMetrics {
  estimatedCurrentValue: number
  purchasePrice: number
  appreciationEstimate: number
  capRate: number           // annualized cash flow / estimated value × 100
  purchaseCapRate: number   // annualized cash flow / purchase price × 100
  totalReturnEstimate: number
  isAnnualized: boolean
}
```

### Scorecard (`packages/shared-types/src/scorecard.types.ts`)

```typescript
type DecisionRating = 'Strong Hold' | 'Hold' | 'Monitor' | 'Sell'

interface CategoryScore {
  score: number
  factors: string[]
}

interface Scorecard {
  id: string
  propertyId: string
  year: number
  period: 'H1' | 'H2'
  financial: CategoryScore
  overallScore: number
  interpretation: DecisionRating
  recommendedDecision: DecisionRating
  decisionReasons: string[]
  userDecisionOverride?: DecisionRating
  decisionNotes?: string
  actionPlan?: string
  createdAt: string
  updatedAt: string
}

type UpdateScorecardInput = {
  userDecisionOverride?: DecisionRating
  decisionNotes?: string
  actionPlan?: string
}
```

---

## Database Schema (`backend/src/db/schema.ts`)

```sql
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
  operational_score REAL NOT NULL,   -- stubbed, not used in scoring yet
  operational_factors TEXT NOT NULL DEFAULT '[]',
  investment_score REAL NOT NULL,    -- stubbed, not used in scoring yet
  investment_factors TEXT NOT NULL DEFAULT '[]',
  strategic_score REAL NOT NULL DEFAULT 3,  -- stubbed, not used in scoring yet
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
```

**Important**: The DB has extra columns (`rent_collected`, `original_loan_amount`, and others) added by a prior implementation attempt that was reverted. These columns are safely ignored by current code — do not add migration blocks that would DROP or REBUILD these tables.

---

## Scoring Logic

### Financial Score (the only score currently calculated)

**Metric**: Cash Flow Margin = `(averages.monthlyCashFlow / averages.monthlyIncome) × 100`

| Margin   | Score | Decision     |
|----------|-------|--------------|
| >= 20%   | 5     | Strong Hold  |
| >= 10%   | 4     | Hold         |
| >= 5%    | 3     | Monitor      |
| < 5%     | 2     | Sell         |

**Overall score = financial score** (other category scores exist in the DB schema but are not yet implemented)

**Decision reasons** are generated alongside the score: e.g. "Excellent cash flow margin (25.3%)", "Avg monthly cash flow: $1,850"

### Live vs. Stored Scorecard Pattern

- **Live scorecard**: computed on-the-fly client-side from `SemiAnnualMetrics` via `computeLiveScorecard()` in `frontend/src/utils/scorecardClient.ts`. No DB query.
- **Stored scorecard**: fetched from the DB via `useScorecard()`. Contains user overrides (`userDecisionOverride`, `decisionNotes`, `actionPlan`).
- **Merged scorecard**: `mergeLiveWithStored(live, propertyId, year, period, stored)` combines both — live scores with stored overrides layered on top.
- Auto-save: pages call `generate(year, period)` silently on load so the DB record exists before any user override.

### Trailing 3-Month Metrics

Dashboard and PropertyDetail overview use `calculateTrailing3MonthsMetrics(monthlyData)` — takes the 3 most recent months regardless of period. Returns a `SemiAnnualMetrics` shape. This is the live signal for badges and portfolio stats.

The formal Scorecard page uses `calculateSemiAnnualMetrics(monthlyData, year, period)` which filters by the selected H1/H2 period.

---

## Backend Services

### `backend/src/services/metricsService.ts`
- `calculateSemiAnnualMetrics(data, year, period)` — filters to H1 (months 1–6) or H2 (months 7–12)
- `calculateInvestmentMetrics(property, semiAnnual)` — annualizes cash flow × 2, computes cap rate and purchase cap rate

### `backend/src/services/scorecardService.ts`
- `scoreFinancial(metrics)` — returns `CategoryScore` with score and factor strings
- `interpretScore(overall)` — maps score to `DecisionRating`
- `recommendDecision(metrics, overall)` — returns decision with human-readable reasons
- `buildScorecard(propertyId, year, period, metrics, existingId?)` — creates or upserts a full `Scorecard` object

---

## API Routes

**Base URL**: `http://localhost:3001`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/properties` | List all (sorted by name) |
| GET | `/api/properties/:id` | Get single property |
| POST | `/api/properties` | Create property |
| PUT | `/api/properties/:id` | Update property (partial) |
| DELETE | `/api/properties/:id` | Delete (cascades monthly + scorecards) |
| GET | `/api/properties/:id/monthly` | List monthly entries |
| POST | `/api/properties/:id/monthly` | Upsert monthly entry |
| DELETE | `/api/properties/:id/monthly/:monthId` | Delete entry |
| GET | `/api/properties/:id/scorecards` | List scorecards |
| POST | `/api/properties/:id/scorecards` | Generate scorecard (auto-calculates) |
| PUT | `/api/properties/:id/scorecards/:scorecardId` | Update override/notes |
| GET | `/api/portfolio/summary?year=&period=` | Portfolio aggregates |
| GET | `/api/backup/export` | Export all data as JSON download |
| POST | `/api/backup/import` | Import JSON (replaces all data) |
| GET | `/api/health` | `{ status: 'ok' }` |

---

## Frontend Architecture

### Routes

```
/ → /dashboard
/dashboard         Portfolio overview
/properties        Property list (sortable table, import/export)
/properties/new    Add property form
/properties/:id    Property detail (Overview, Scorecard, Monthly History tabs)
/monthly           Monthly data entry
/comparison        Side-by-side property comparison
/scorecard         Semi-annual scorecard view with period selector
```

### Custom Hooks

- `useProperties()` — full list, `createProperty`, `updateProperty`, `deleteProperty`
- `useProperty(id)` — single property with `refetch()`
- `useMonthlyData(propertyId)` — list + `upsertEntry`, `deleteEntry`, `getEntry(year, month)`
- `useScorecard(propertyId)` — list + `generate(year, period)`, `update(id, input)`, `getScorecard(year, period)`
- `useLocalPrefs()` — persists `selectedYear`, `selectedPeriod`, `selectedPropertyId` to localStorage

### Key Frontend Utils

**`frontend/src/utils/metricsClient.ts`**
- `calculateSemiAnnualMetrics(data, year, period)`
- `calculateTrailing3MonthsMetrics(data)` — sorts desc, takes 3 most recent
- `calculateInvestmentMetrics(property, semiAnnual)`

**`frontend/src/utils/scorecardClient.ts`**
- `computeLiveScorecard(metrics)` — client-side scoring, mirrors backend logic
- `mergeLiveWithStored(live, propertyId, year, period, stored?)` → `Scorecard`

**`frontend/src/api/client.ts`** — typed API client (`api.properties`, `api.monthly`, `api.scorecards`, `api.portfolio`, `api.backup`)

### Component Map

```
components/
  layout/       AppShell, Header, Sidebar, BottomNav, PageContainer
  dashboard/    PortfolioStats, PortfolioROIBar, PropertyGrid, PropertyCard, WatchlistPanel
  properties/   PropertyForm, ForecastChart
  scorecard/    OverallScoreDisplay, DecisionPanel, DecisionOverride, CategoryScoreCard,
                FinancialSummary, PeriodSelector
  monthly/      MonthSelector, MonthlyHistoryTable, MonthlyMetricsBar
  comparison/   PropertySelector, MetricSelector, ComparisonTable
  ui/           ScoreBadge, DecisionLabel, MetricBar, TabGroup, SortableTable,
                CurrencyInput, FormField, LoadingSpinner, EmptyState, ConfirmModal
```

### WatchlistPanel

Shows properties with `recommendedDecision` (or `userDecisionOverride`) in `['Monitor', 'Sell']`. This is the "Action Items" sidebar on the dashboard.

---

## What Is and Isn't Implemented

### Currently implemented
- Property CRUD (basic fields only — no financing section)
- Monthly data entry (total income + total expenses + notes)
- Financial scoring from cash flow margin
- Decision ratings: Strong Hold / Hold / Monitor / Sell
- User decision override + notes + action plan
- Portfolio dashboard with trailing 3-month live metrics
- Semi-annual scorecard page with period selection
- Property detail with Overview / Scorecard / Monthly History tabs
- Comparison view
- JSON backup export/import
- PWA support

### Not yet implemented (future work)
- Financing data fields (loan amount, rate, DSCR, LTV, equity)
- Granular monthly income/expense line items
- Operational score (occupancy, vacancy days, work orders, tenant issues)
- Investment return score (cash-on-cash, cap rate vs. purchase, equity created)
- Strategic fit score
- Weighted multi-category overall score (Financial 35%, Operational 25%, Investment 30%, Strategic 10%)
- Expanded decision ratings (Improve, Refinance, Raise Rents, Watchlist, Sell/1031)
- Print/PDF export

---

## Product Philosophy

- Monthly results are inputs, not final judgments. Avoid overreacting to one-off repairs, vacancy, or timing.
- Formal scoring should reflect multi-month trends. Trailing 3-month is the live signal; H1/H2 periods are the formal evaluation.
- Decisions should be explainable — always show why a recommendation was made.
- Built for an owner/operator, not an institutional analyst. Plain language, clean UI, practical actions.
- When extending the scoring system, keep the existing `CategoryScore` / `Scorecard` types and DB schema — add to them, don't replace them.

---

## Example Seed Properties (North Star Ventures portfolio)

- 1008-1012 S Rouse
- 1301 S Virginia
- 1301 West Central Street
- 2229-2231 Arizona Ave
- 313-315 Ash Craft
- 515-517 Jefferson St.
- 702 S Main ST
- 712 S Virginia
- Laurel - Duplex
- Middle West Building
- Turk Duplex
- Zora Duplex

These are real properties. Do not hard-code financial data for them. Use seed scripts (`npm run seed`) for demo data only.
