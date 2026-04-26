# North Star Ventures — App Skill

## Purpose

You are helping build and maintain the North Star Ventures property management application. This is a full-stack local app for tracking rental property performance, generating semi-annual scorecards, analyzing potential acquisitions, and supporting investment decision-making.

The primary user is the owner/operator of North Star Ventures. The app helps answer:

- Which properties are performing well vs. dragging down cash flow?
- Which properties need operational attention?
- Should a property be held, monitored, or sold?
- What is the portfolio's projected annual income and cash flow?
- What is the max price I can pay for a deal to hit a Strong Buy / Buy score?
- What is the minimum rent needed on a deal to hit a target score?

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

### Deal (`packages/shared-types/src/deal.types.ts`)

```typescript
type FinancingType = 'interest-only' | '20-year-am' | '25-year-am' | '30-year-am' | 'cash'

interface Deal {
  id: string
  name: string
  address: string
  propertyType: PropertyType
  units: number
  sqft?: number
  purchasePrice: number
  monthlyRent: number
  financingType: FinancingType
  interestRate: number
  loanAmount: number
  pmPercent: number
  vacancyPct: number            // default 5
  maintenanceReservePct: number // default 10 (advisory, not deducted)
  insurancePct: number          // default 0.5 (annual % of purchase price)
  taxPct: number                // default 1.2 (annual % of purchase price)
  notes?: string
  status: 'active' | 'converted'
  convertedPropertyId?: string
  createdAt: string
  updatedAt: string
}

type CreateDealInput = Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>
type UpdateDealInput = Partial<Omit<CreateDealInput, 'name'>>
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
```

**Important**: The DB has extra columns (`rent_collected`, `original_loan_amount`, and others) added by a prior implementation attempt that was reverted. These columns are safely ignored by current code — do not add migration blocks that would DROP or REBUILD these tables.

The `deals` table has 4 assumption columns (`vacancy_pct`, `maintenance_reserve_pct`, `insurance_pct`, `tax_pct`) that were added after initial creation. `schema.ts` includes `ALTER TABLE ADD COLUMN` migration blocks (wrapped in try/catch) to add them to existing databases.

---

## Property Scorecard Scoring Logic

### Financial Score (the only score currently calculated)

**Metric**: Cash Flow Margin = `(averages.monthlyCashFlow / averages.monthlyIncome) × 100`

| Margin  | Score | Decision    |
| ------- | ----- | ----------- |
| >= 20%  | 5     | Strong Hold |
| >= 10%  | 4     | Hold        |
| >= 5%   | 3     | Monitor     |
| < 5%    | 2     | Sell        |

**Overall score = financial score** (other category scores exist in the DB schema but are not yet implemented)

### Live vs. Stored Scorecard Pattern

- **Live scorecard**: computed on-the-fly client-side from `SemiAnnualMetrics` via `computeLiveScorecard()` in `frontend/src/utils/scorecardClient.ts`. No DB query.
- **Stored scorecard**: fetched from the DB via `useScorecard()`. Contains user overrides (`userDecisionOverride`, `decisionNotes`, `actionPlan`).
- **Merged scorecard**: `mergeLiveWithStored(live, propertyId, year, period, stored)` combines both — live scores with stored overrides layered on top.
- Auto-save: pages call `generate(year, period)` silently on load so the DB record exists before any user override.

### Trailing 3-Month Metrics

Dashboard and PropertyDetail overview use `calculateTrailing3MonthsMetrics(monthlyData)` — takes the 3 most recent months regardless of period. Returns a `SemiAnnualMetrics` shape. This is the live signal for badges and portfolio stats.

The formal Scorecard page uses `calculateSemiAnnualMetrics(monthlyData, year, period)` which filters by the selected H1/H2 period.

---

## Deal Analyzer — Pro-Forma Calc Engine (`frontend/src/utils/proFormaCalc.ts`)

All deal analysis math lives here. No backend involvement — fully client-side.

### `ProFormaInputs`

```typescript
interface ProFormaInputs {
  purchasePrice: number
  monthlyRent: number
  financingType: FinancingType
  interestRate: number           // annual %, e.g. 7.5
  loanAmount: number             // driven by LTV dropdown
  pmPercent: number              // e.g. 10 for 10%
  vacancyPct?: number            // default 5
  maintenanceReservePct?: number // default 10
  insurancePct?: number          // default 0.5
  taxPct?: number                // default 1.2
}
```

### `ProFormaLines` (monthly)

```typescript
interface ProFormaLines {
  grossRent: number
  vacancy: number
  effectiveIncome: number
  pmFee: number
  insurance: number
  taxes: number
  operatingExpenses: number
  noi: number
  debtService: number
  cashFlow: number            // after debt service (liquid cash)
  monthlyPrincipal: number    // first-month principal portion (0 for IO/cash)
  actualCashFlow: number      // cashFlow + monthlyPrincipal (economic return)
  maintenanceReserve: number  // advisory only — not deducted from cash flow
}
```

### `ProFormaResult`

```typescript
interface ProFormaResult {
  lines: ProFormaLines
  annualNOI: number
  capRate: number
  cashInvested: number    // down payment + 2.5% closing costs
  cashOnCash: number
  cashFlowMargin: number  // actualCashFlow / effectiveIncome × 100 (includes principal for amortizing)
  score: 2 | 3 | 4 | 5
  decision: AcquisitionDecision  // 'Strong Buy' | 'Buy' | 'Borderline' | 'Pass' | 'Negative Cash Flow'
}
```

### Deal Analyzer Scoring

`cashFlowMargin` uses `actualCashFlow` (cash flow + principal paydown) for amortizing loans. IO and cash loans are unaffected since their `monthlyPrincipal` is 0.

| Condition               | Score | Decision           |
| ----------------------- | ----- | ------------------ |
| raw `cashFlow < 0`      | 2     | Negative Cash Flow |
| `cashFlowMargin >= 20%` | 5     | Strong Buy         |
| `cashFlowMargin >= 10%` | 4     | Buy                |
| `cashFlowMargin >= 5%`  | 3     | Borderline         |
| else                    | 2     | Pass               |

### Amortization Terms

```typescript
const AM_TERMS = { '20-year-am': 240, '25-year-am': 300, '30-year-am': 360 }
// Monthly payment: M = P × [r(1+r)^n] / [(1+r)^n − 1]
```

### Key Functions

**`computeProForma(inputs)`** → `ProFormaResult | null` (null if price or rent is 0)

**`computeProjection(inputs, result)`** → `YearProjection[]` (20 years)

- 2% annual property appreciation (compounded)
- Rent held flat
- Tracks: propertyValue, loanBalance, equity, annualCashFlow, principalPaydown, interestPaid, appreciationGain, totalReturn, cumulativeReturn, cashInvested, roi

**`solveMaxPurchasePrice(inputs, targetMarginPct, ltvPct)`** → `number | null`

- Binary search in $500 increments
- Returns highest price where `computeProForma` confirms `cashFlowMargin >= targetMarginPct`
- Used for Score 5 (target 20%) and Score 4 (target 10%) recommendations

**`solveMinMonthlyRent(inputs, targetMarginPct)`** → `number | null`

- Binary search in $10 increments
- Returns lowest rent where `computeProForma` confirms `cashFlowMargin >= targetMarginPct`
- Used for Score 5 and Score 4 rent recommendations

---

## Deal Analyzer — UI (`frontend/src/pages/DealAnalyzer.tsx`)

### View Structure

Two views controlled by `view: 'list' | 'detail'` state in the root `DealAnalyzer` component.

**List view**: Table of saved deals showing name, type, purchase price, rent, cash flow, cap rate, decision badge, score badge, and actions (Edit / Add to Portfolio / Delete). Converted deals show "Added to Portfolio" + "View →" link.

**Detail view** (`DealDetail` component): Full form + live results panel.

### `FormState`

```typescript
interface FormState {
  name: string
  address: string
  propertyType: PropertyType
  units: number
  sqft?: number
  inputs: ProFormaInputs
  ltvPercent: number     // 75–100 in 5% steps; drives loanAmount = purchasePrice × ltv/100
  activeDealId?: string  // undefined = new deal
}
```

**BLANK defaults**: financingType `'interest-only'`, interestRate `7`, pmPercent `10`, ltvPercent `100`, vacancyPct `5`, maintenanceReservePct `10`, insurancePct `0.5`, taxPct `1.2`

### Detail View Layout

**Action bar** (top): deal name display, Print button (shown when result exists), Save Deal / Update Deal, Add to Portfolio

**Left column** (inputs):

- Property Details: name, address, type, units, sqft
- Financials: purchase price, monthly rent, financing type, property management %; if financed → LTV dropdown (100/95/90/85/80/75%), read-only loan amount display, interest rate
- Assumptions (editable): vacancy %, maintenance reserve %, insurance %, property tax %

**Right column** (sticky, live results):

- Score card: score badge + decision badge; "Actual Cash Flow" (or "Cash Flow" for IO/cash) in large type + rent margin %
- MetricBar
- Decision context text
- "Max Price to Achieve" recommendations (Score 5, Score 4) — clickable, applies price + recalculates loan
- "Min Rent to Achieve" recommendations (Score 5, Score 4) — clickable, applies rent
- 4 metric cards: Cap Rate, Cash-on-Cash, Annual NOI, Actual Annual CF (or Annual Cash Flow for IO/cash)
- Monthly Pro-Forma waterfall: Gross Rent → Vacancy → Effective Income → PM Fee → Insurance → Taxes → NOI → Debt Service → Monthly Cash Flow → [Principal Paydown + Actual Cash Flow for amortizing] → Maintenance Reserve (advisory)

**Below the grid** (full-width):

- `ProjectionSection`: summary stats (5-yr/20-yr total return + ROI), 5-year stacked bar chart (cash flow + principal + appreciation), cumulative return SVG line chart (20 years), 20-year detail table

### Print / PDF

`printDeal(form, result)` — opens a new browser window with a styled 2-page HTML report and triggers `window.print()`. No dependencies. Page 1: header, score, metrics, monthly waterfall, assumptions + financing tables. Page 2: projection summary + 20-year table.

### Convert to Property

"Add to Portfolio" creates a `Property` from the deal inputs, marks the deal `status: 'converted'`, and navigates to the new property's detail page.

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

| Method | Path                                        | Description                        |
| ------ | ------------------------------------------- | ---------------------------------- |
| GET    | `/api/properties`                           | List all (sorted by name)          |
| GET    | `/api/properties/:id`                       | Get single property                |
| POST   | `/api/properties`                           | Create property                    |
| PUT    | `/api/properties/:id`                       | Update property (partial)          |
| DELETE | `/api/properties/:id`                       | Delete (cascades monthly + scores) |
| GET    | `/api/properties/:id/monthly`               | List monthly entries               |
| POST   | `/api/properties/:id/monthly`               | Upsert monthly entry               |
| DELETE | `/api/properties/:id/monthly/:monthId`      | Delete entry                       |
| GET    | `/api/properties/:id/scorecards`            | List scorecards                    |
| POST   | `/api/properties/:id/scorecards`            | Generate scorecard (auto-calc)     |
| PUT    | `/api/properties/:id/scorecards/:id`        | Update override/notes              |
| GET    | `/api/portfolio/summary?year=&period=`      | Portfolio aggregates               |
| GET    | `/api/deals`                                | List all deals (newest first)      |
| POST   | `/api/deals`                                | Create deal                        |
| PUT    | `/api/deals/:id`                            | Update deal                        |
| DELETE | `/api/deals/:id`                            | Delete deal                        |
| GET    | `/api/backup/export`                        | Export all data as JSON download   |
| POST   | `/api/backup/import`                        | Import JSON (replaces all data)    |
| GET    | `/api/health`                               | `{ status: 'ok' }`                 |

---

## Frontend Architecture

### Routes

```text
/ → /dashboard
/dashboard        Portfolio overview
/properties       Property list (sortable table, import/export)
/properties/new   Add property form
/properties/:id   Property detail (Overview, Scorecard, Monthly History tabs)
/deal-analyzer    Deal Analyzer (list of saved deals + detail/edit view)
```

### Custom Hooks

- `useProperties()` — full list, `createProperty`, `updateProperty`, `deleteProperty`
- `useProperty(id)` — single property with `refetch()`
- `useMonthlyData(propertyId)` — list + `upsertEntry`, `deleteEntry`, `getEntry(year, month)`
- `useScorecard(propertyId)` — list + `generate(year, period)`, `update(id, input)`, `getScorecard(year, period)`
- `useDeals()` — full list, `createDeal`, `updateDeal`, `deleteDeal`, `refetch`
- `useLocalPrefs()` — persists `selectedYear`, `selectedPeriod`, `selectedPropertyId` to localStorage

### Key Frontend Utils

**`frontend/src/utils/metricsClient.ts`**

- `calculateSemiAnnualMetrics(data, year, period)`
- `calculateTrailing3MonthsMetrics(data)` — sorts desc, takes 3 most recent
- `calculateInvestmentMetrics(property, semiAnnual)`

**`frontend/src/utils/scorecardClient.ts`**

- `computeLiveScorecard(metrics)` — client-side scoring, mirrors backend logic
- `mergeLiveWithStored(live, propertyId, year, period, stored?)` → `Scorecard`

**`frontend/src/utils/proFormaCalc.ts`** — Deal Analyzer calculation engine (see above)

**`frontend/src/api/client.ts`** — typed API client (`api.properties`, `api.monthly`, `api.scorecards`, `api.portfolio`, `api.deals`, `api.backup`)

### Component Map

```text
components/
  layout/     AppShell, Header, Sidebar, BottomNav, PageContainer
  dashboard/  PortfolioStats, PortfolioROIBar, PropertyGrid, PropertyCard, WatchlistPanel
  properties/ PropertyForm, ForecastChart
  scorecard/  OverallScoreDisplay, DecisionPanel, DecisionOverride, CategoryScoreCard,
              FinancialSummary, PeriodSelector
  monthly/    MonthSelector, MonthlyHistoryTable, MonthlyMetricsBar
  ui/         ScoreBadge, DecisionLabel, MetricBar, TabGroup, SortableTable,
              CurrencyInput, FormField, LoadingSpinner, EmptyState, ConfirmModal

pages/
  Dashboard.tsx
  PropertyList.tsx
  PropertyDetail.tsx
  DealAnalyzer.tsx  — includes DealRow, DealDetail, ProjectionSection,
                      CumulativeReturnChart, WaterfallRow, printDeal
```

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
- JSON backup export/import
- PWA support
- **Deal Analyzer** — full pro-forma analysis, saving deals, converting to portfolio properties
  - Financing: interest-only, 20/25/30-year amortization, cash
  - LTV dropdown (100–75% in 5% steps)
  - Editable assumptions per deal (vacancy, maintenance reserve, insurance, property tax)
  - Actual cash flow (cash flow + principal paydown) used in scoring and displayed on card for amortizing loans
  - Max purchase price recommendations for Score 4 and Score 5
  - Min rent recommendations for Score 4 and Score 5
  - 5-year stacked bar chart (cash flow, principal paydown, appreciation)
  - 20-year cumulative return line chart
  - 20-year projection table
  - Print/PDF report (2-page browser print)

### Not yet implemented (future work)

- Financing data fields on properties (loan amount, rate, DSCR, LTV, equity)
- Granular monthly income/expense line items
- Operational score (occupancy, vacancy days, work orders, tenant issues)
- Investment return score (cash-on-cash, cap rate vs. purchase, equity created)
- Strategic fit score
- Weighted multi-category overall score (Financial 35%, Operational 25%, Investment 30%, Strategic 10%)
- Expanded property decision ratings (Improve, Refinance, Raise Rents, Watchlist, Sell/1031)

---

## Product Philosophy

- Monthly results are inputs, not final judgments. Avoid overreacting to one-off repairs, vacancy, or timing.
- Formal scoring should reflect multi-month trends. Trailing 3-month is the live signal; H1/H2 periods are the formal evaluation.
- Decisions should be explainable — always show why a recommendation was made.
- Built for an owner/operator, not an institutional analyst. Plain language, clean UI, practical actions.
- When extending the scoring system, keep the existing `CategoryScore` / `Scorecard` types and DB schema — add to them, don't replace them.
- Deal Analyzer is fully client-side math — do not move pro-forma calculations to the backend.

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
