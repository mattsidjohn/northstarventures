'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid,
} from 'recharts'
import { PropertyType, Deal, FinancingType } from '@/types'
import Header from '@/components/layout/Header'
import PageContainer from '@/components/layout/PageContainer'
import ScoreBadge from '@/components/ui/ScoreBadge'
import MetricBar from '@/components/ui/MetricBar'
import CurrencyInput from '@/components/ui/CurrencyInput'
import FormField from '@/components/ui/FormField'
import { useProperties } from '@/hooks/useProperties'
import { useDeals } from '@/hooks/useDeals'
import { computeProForma, computeProjection, solveMaxPurchasePrice, solveMinMonthlyRent, ProFormaInputs, ProFormaResult, AcquisitionDecision, YearProjection } from '@/utils/proFormaCalc'
import { formatCurrency, formatPercent } from '@/utils/format'

// ── Print / PDF ───────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function scoreColor(score: number): string {
  if (score >= 5) return '#059669'
  if (score >= 4) return '#16a34a'
  if (score >= 3) return '#d97706'
  return '#dc2626'
}

function decisionBg(decision: string): string {
  if (decision === 'Strong Buy') return '#d1fae5'
  if (decision === 'Buy') return '#dcfce7'
  if (decision === 'Borderline') return '#fef3c7'
  return '#fee2e2'
}

function printDeal(form: FormState, result: ProFormaResult): void {
  const projections = computeProjection(form.inputs, result)
  const isAmortizing = form.inputs.financingType !== 'interest-only' && form.inputs.financingType !== 'cash'
  const finLabel = FINANCING_OPTIONS.find(f => f.value === form.inputs.financingType)?.label ?? form.inputs.financingType
  const propLabel = PROPERTY_TYPES.find(t => t.value === form.propertyType)?.label ?? form.propertyType
  const yr5 = projections[4]
  const yr20 = projections[19]
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const sc = scoreColor(result.score)
  const dbg = decisionBg(result.decision)

  const fc = (v: number, compact = false) => formatCurrency(v, compact)
  const fp = (v: number) => formatPercent(v)

  const wfRow = (label: string, value: number, indent = false, bold = false, colored = false, advisory = false) => {
    const color = colored ? (value < 0 ? '#dc2626' : '#059669') : advisory ? '#b45309' : bold ? '#111827' : indent ? '#6b7280' : '#374151'
    const display = indent && !colored ? `– ${fc(Math.abs(value))}` : fc(value)
    return `<tr>
      <td style="padding:5px 8px;${indent || advisory ? 'padding-left:24px;' : ''}${bold ? 'font-weight:600;' : ''}color:${advisory ? '#b45309' : indent ? '#6b7280' : '#374151'};font-size:12px;">${label}${advisory ? ' <span style="font-size:10px;">(advisory)</span>' : ''}</td>
      <td style="padding:5px 8px;text-align:right;font-weight:${bold ? '600' : '400'};color:${color};font-size:12px;font-variant-numeric:tabular-nums;">${display}</td>
    </tr>`
  }

  const projRow = (p: YearProjection) => {
    const hl = p.year === 5 || p.year === 10 || p.year === 20
    const bg = hl ? '#f8fafc' : 'transparent'
    const fw = hl ? '600' : '400'
    return `<tr style="background:${bg};">
      <td style="padding:4px 6px;font-size:11px;font-weight:${fw};color:#374151;">Yr ${p.year}</td>
      <td style="padding:4px 6px;text-align:right;font-size:11px;color:#6b7280;font-variant-numeric:tabular-nums;">${fc(p.propertyValue, true)}</td>
      <td style="padding:4px 6px;text-align:right;font-size:11px;color:${p.annualCashFlow >= 0 ? '#059669' : '#dc2626'};font-weight:500;font-variant-numeric:tabular-nums;">${fc(p.annualCashFlow, true)}</td>
      ${isAmortizing ? `<td style="padding:4px 6px;text-align:right;font-size:11px;color:#2563eb;font-variant-numeric:tabular-nums;">${fc(p.principalPaydown, true)}</td>` : ''}
      <td style="padding:4px 6px;text-align:right;font-size:11px;color:#ea580c;font-variant-numeric:tabular-nums;">${fc(p.interestPaid, true)}</td>
      <td style="padding:4px 6px;text-align:right;font-size:11px;color:#7c3aed;font-variant-numeric:tabular-nums;">${fc(p.appreciationGain, true)}</td>
      <td style="padding:4px 6px;text-align:right;font-size:11px;font-weight:600;color:#111827;font-variant-numeric:tabular-nums;">${fc(p.totalReturn, true)}</td>
      <td style="padding:4px 6px;text-align:right;font-size:11px;font-weight:${fw};color:${p.cumulativeReturn >= 0 ? '#111827' : '#dc2626'};font-variant-numeric:tabular-nums;">${fc(p.cumulativeReturn, true)}</td>
      <td style="padding:4px 6px;text-align:right;font-size:11px;font-weight:700;color:${p.roi >= 0 ? '#059669' : '#dc2626'};font-variant-numeric:tabular-nums;">${p.roi.toFixed(1)}%</td>
    </tr>`
  }

  const thStyle = 'padding:5px 6px;text-align:right;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;white-space:nowrap;border-bottom:1px solid #e5e7eb;'

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Deal Analysis — ${escapeHtml(form.name || 'Untitled')}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: white; font-size: 13px; line-height: 1.4; }
    @page { size: letter; margin: 0.65in 0.7in; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    table { border-collapse: collapse; width: 100%; }
    .page-break { page-break-before: always; }
    .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 8px; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 18px 0; }
    .metric-card { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; }
    .metric-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 4px; }
    .metric-value { font-size: 18px; font-weight: 700; }
    .metric-sub { font-size: 10px; color: #9ca3af; margin-top: 2px; }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="background:#0f172a;color:white;padding:18px 24px;border-radius:8px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <div style="font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">North Star Ventures · Deal Analysis</div>
      <div style="font-size:22px;font-weight:700;margin-bottom:4px;">${escapeHtml(form.name || 'Untitled Deal')}</div>
      ${form.address ? `<div style="font-size:12px;color:#94a3b8;">${escapeHtml(form.address)}</div>` : ''}
      <div style="font-size:11px;color:#64748b;margin-top:4px;">${propLabel}${form.units > 1 ? ` · ${form.units} units` : ''}${form.sqft ? ` · ${form.sqft.toLocaleString()} sqft` : ''}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:10px;color:#64748b;">Generated</div>
      <div style="font-size:12px;font-weight:600;color:#e2e8f0;">${today}</div>
    </div>
  </div>

  <!-- Score + Cash Flow -->
  <div style="display:flex;gap:16px;margin-bottom:18px;align-items:stretch;">
    <div style="flex:1;border:2px solid ${sc};border-radius:8px;padding:14px 18px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div class="section-title" style="margin:0;">Pro-Forma Score</div>
        <div style="display:inline-block;background:${dbg};color:${sc};font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid ${sc};">${result.decision}</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:40px;height:40px;border-radius:50%;background:${sc};color:white;font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:center;">${result.score}</div>
        <div style="font-size:11px;color:#6b7280;">out of 5</div>
      </div>
      <div style="font-size:11px;color:#6b7280;line-height:1.5;">${DECISION_CONTEXT[result.decision]}</div>
    </div>
    <div style="width:180px;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;background:#f8fafc;">
      <div class="section-title">Actual Cash Flow</div>
      <div style="font-size:26px;font-weight:800;color:${result.lines.actualCashFlow >= 0 ? '#059669' : '#dc2626'};">${fc(result.lines.actualCashFlow)}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px;">per month</div>
      <div style="font-size:12px;font-weight:700;margin-top:6px;color:${result.cashFlowMargin >= 20 ? '#059669' : result.cashFlowMargin >= 10 ? '#16a34a' : result.cashFlowMargin >= 5 ? '#d97706' : '#dc2626'};">${result.cashFlowMargin.toFixed(1)}% rent margin</div>
    </div>
  </div>

  <!-- Key Metrics -->
  <div class="section-title">Acquisition Metrics</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px;">
    ${[
      { label: 'Purchase Price', value: fc(form.inputs.purchasePrice), sub: '' },
      { label: 'Cap Rate', value: fp(result.capRate), sub: 'NOI / purchase price' },
      { label: 'Cash-on-Cash', value: fp(result.cashOnCash), sub: 'Annual CF / cash in', color: result.cashOnCash >= 0 ? '#059669' : '#dc2626' },
      { label: 'Annual NOI', value: fc(result.annualNOI, true), sub: 'Before debt service' },
    ].map(m => `<div class="metric-card">
      <div class="metric-label">${m.label}</div>
      <div class="metric-value" style="color:${m.color ?? '#111827'};">${m.value}</div>
      ${m.sub ? `<div class="metric-sub">${m.sub}</div>` : ''}
    </div>`).join('')}
  </div>

  <!-- Monthly Pro-Forma -->
  <div class="section-title">Monthly Pro-Forma</div>
  <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:18px;">
    <table>
      <tbody style="background:white;">
        ${wfRow('Gross Rent', result.lines.grossRent, false, true)}
        ${wfRow(`Vacancy (${form.inputs.vacancyPct}%)`, result.lines.vacancy, true)}
        ${wfRow('Effective Income', result.lines.effectiveIncome, false, true)}
        ${wfRow(`Property Mgmt (${form.inputs.pmPercent}%)`, result.lines.pmFee, true)}
        ${wfRow(`Insurance (${form.inputs.insurancePct}% / yr)`, result.lines.insurance, true)}
        ${wfRow(`Property Taxes (${form.inputs.taxPct}% / yr)`, result.lines.taxes, true)}
        ${wfRow('Net Operating Income', result.lines.noi, false, true)}
        ${wfRow(form.inputs.financingType !== 'cash' ? `Debt Service (${form.ltvPercent}% LTV)` : 'Debt Service', result.lines.debtService, true)}
        ${wfRow('Monthly Cash Flow', result.lines.cashFlow, false, true, true)}
        ${result.lines.monthlyPrincipal > 0 ? `<tr>
          <td style="padding:5px 8px;padding-left:24px;color:#2563eb;font-size:12px;">+ Principal Paydown (mo. 1)</td>
          <td style="padding:5px 8px;text-align:right;color:#2563eb;font-size:12px;font-variant-numeric:tabular-nums;">+ ${fc(result.lines.monthlyPrincipal)}</td>
        </tr>` : ''}
        ${result.lines.monthlyPrincipal > 0 ? wfRow('Actual Cash Flow', result.lines.actualCashFlow, false, true, true) : ''}
        ${result.lines.maintenanceReserve > 0 ? wfRow(`Maintenance Reserve (${form.inputs.maintenanceReservePct}%)`, result.lines.maintenanceReserve, true, false, false, true) : ''}
      </tbody>
    </table>
  </div>

  <!-- Assumptions + Financing -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;">
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;background:#f8fafc;">
      <div class="section-title">Assumptions</div>
      <table style="width:100%;">
        <tbody>
          ${[
            ['Vacancy', `${form.inputs.vacancyPct}% of rent`],
            ['Maint. Reserve', `${form.inputs.maintenanceReservePct}% of rent (advisory)`],
            ['Insurance', `${form.inputs.insurancePct}% of price / yr`],
            ['Property Tax', `${form.inputs.taxPct}% of price / yr`],
          ].map(([k, v]) => `<tr>
            <td style="font-size:11px;color:#6b7280;padding:3px 0;">${k}</td>
            <td style="font-size:11px;font-weight:600;color:#374151;text-align:right;padding:3px 0;">${v}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;background:#f8fafc;">
      <div class="section-title">Financing</div>
      <table style="width:100%;">
        <tbody>
          ${[
            ['Type', finLabel],
            ...(form.inputs.financingType !== 'cash' ? [
              ['Interest Rate', `${form.inputs.interestRate}%`],
              ['LTV', `${form.ltvPercent}%`],
              ['Loan Amount', fc(form.inputs.loanAmount)],
            ] : []),
            ['Cash Invested', fc(result.cashInvested)],
          ].map(([k, v]) => `<tr>
            <td style="font-size:11px;color:#6b7280;padding:3px 0;">${k}</td>
            <td style="font-size:11px;font-weight:600;color:#374151;text-align:right;padding:3px 0;">${v}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Page 2: Projection -->
  <div class="page-break">
    <!-- Projection Header -->
    <div style="background:#0f172a;color:white;padding:12px 18px;border-radius:8px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;">North Star Ventures · Deal Analysis</div>
        <div style="font-size:16px;font-weight:700;margin-top:2px;">${form.name || 'Untitled Deal'} — 20-Year Projection</div>
      </div>
      <div style="font-size:11px;color:#64748b;">2% annual appreciation · rent held flat</div>
    </div>

    <!-- Projection Summary -->
    <div class="section-title">Projection Summary</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px;">
      ${[
        { label: '5-Yr Total Return', value: fc(yr5.cumulativeReturn, true), color: yr5.cumulativeReturn >= 0 ? '#111827' : '#dc2626' },
        { label: '5-Yr ROI', value: `${yr5.roi.toFixed(1)}%`, color: yr5.roi >= 0 ? '#059669' : '#dc2626' },
        { label: '20-Yr Total Return', value: fc(yr20.cumulativeReturn, true), color: yr20.cumulativeReturn >= 0 ? '#111827' : '#dc2626' },
        { label: '20-Yr ROI', value: `${yr20.roi.toFixed(1)}%`, color: yr20.roi >= 0 ? '#059669' : '#dc2626' },
      ].map(m => `<div class="metric-card">
        <div class="metric-label">${m.label}</div>
        <div class="metric-value" style="color:${m.color};">${m.value}</div>
      </div>`).join('')}
    </div>

    <!-- 20-Year Table -->
    <div class="section-title">20-Year Detail</div>
    <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <table>
        <thead>
          <tr style="background:#f8fafc;">
            <th style="${thStyle}text-align:left;">Year</th>
            <th style="${thStyle}">Prop. Value</th>
            <th style="${thStyle}color:#059669;">Cash Flow</th>
            ${isAmortizing ? `<th style="${thStyle}color:#2563eb;">Principal</th>` : ''}
            <th style="${thStyle}color:#ea580c;">Interest</th>
            <th style="${thStyle}color:#7c3aed;">Appreciation</th>
            <th style="${thStyle}">Yr Return</th>
            <th style="${thStyle}">Cumul. Return</th>
            <th style="${thStyle}color:#059669;">ROI</th>
          </tr>
        </thead>
        <tbody>
          ${projections.map(projRow).join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'single-family', label: 'Single Family' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'multi-unit', label: 'Multi-Unit' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed-use', label: 'Mixed Use' },
]

const FINANCING_OPTIONS: { value: FinancingType; label: string }[] = [
  { value: 'interest-only', label: 'Interest Only' },
  { value: '20-year-am', label: '20-Year Amortization' },
  { value: '25-year-am', label: '25-Year Amortization' },
  { value: '30-year-am', label: '30-Year Amortization' },
  { value: 'cash', label: 'Cash Purchase' },
]

const DECISION_STYLES: Record<AcquisitionDecision, string> = {
  'Strong Buy':        'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Buy':               'bg-green-100 text-green-700 border-green-200',
  'Borderline':        'bg-amber-100 text-amber-700 border-amber-200',
  'Pass':              'bg-red-100 text-red-600 border-red-200',
  'Negative Cash Flow':'bg-red-100 text-red-600 border-red-200',
}

const DECISION_CONTEXT: Record<AcquisitionDecision, string> = {
  'Strong Buy':        'Strong cash flow margin. Solid addition to the portfolio.',
  'Buy':               'Good cash flow margin. Worth acquiring at current assumptions.',
  'Borderline':        'Thin margin. Small cost increases or rent declines could push this negative.',
  'Pass':              'Insufficient cash flow. Capital is better deployed elsewhere.',
  'Negative Cash Flow':'Projects negative cash flow at current assumptions. Not recommended.',
}

const selectClass = 'px-4 py-3 text-[15px] bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow'
const labelClass = 'text-xs font-semibold text-gray-600 uppercase tracking-wider'

function WaterfallRow({ label, value, indent, bold, colored, advisory, additive }: {
  label: string; value: number; indent?: boolean; bold?: boolean; colored?: boolean; advisory?: boolean; additive?: boolean
}) {
  const isNeg = value < 0
  const colorClass = additive
    ? 'text-blue-600'
    : colored
    ? isNeg ? 'text-red-600' : 'text-emerald-700'
    : advisory ? 'text-amber-600'
    : indent ? 'text-gray-500' : 'text-gray-900'
  const display = additive
    ? `+ ${formatCurrency(value)}`
    : indent && !colored
    ? `– ${formatCurrency(Math.abs(value))}`
    : formatCurrency(value)
  return (
    <div className={`flex justify-between py-2.5 ${indent || advisory || additive ? 'pl-5' : ''} ${bold ? 'font-semibold' : ''}`}>
      <span className={`text-sm ${advisory ? 'text-amber-600' : additive ? 'text-blue-600' : indent ? 'text-gray-500' : 'text-gray-700'}`}>{label}</span>
      <span className={`text-sm tabular-nums ${colorClass} ${bold ? 'font-semibold' : ''}`}>{display}</span>
    </div>
  )
}

const LTV_OPTIONS = [100, 95, 90, 85, 80, 75]

interface FormState {
  name: string; address: string; propertyType: PropertyType; units: number; sqft?: number
  inputs: ProFormaInputs
  ltvPercent: number
  activeDealId?: string
}

const BLANK: FormState = {
  name: '', address: '', propertyType: 'single-family', units: 1, sqft: undefined,
  inputs: { purchasePrice: 0, monthlyRent: 0, financingType: 'interest-only', interestRate: 7, loanAmount: 0, pmPercent: 10, vacancyPct: 5, maintenanceReservePct: 10, insurancePct: 0.5, taxPct: 1.2 },
  ltvPercent: 100,
  activeDealId: undefined,
}

function dealToFormState(d: Deal): FormState {
  const ltvPercent = d.purchasePrice > 0 && d.financingType !== 'cash'
    ? Math.max(75, Math.min(100, Math.round((d.loanAmount / d.purchasePrice) * 100 / 5) * 5))
    : 100
  return {
    name: d.name, address: d.address, propertyType: d.propertyType, units: d.units, sqft: d.sqft,
    inputs: { purchasePrice: d.purchasePrice, monthlyRent: d.monthlyRent, financingType: d.financingType, interestRate: d.interestRate, loanAmount: d.loanAmount, pmPercent: d.pmPercent, vacancyPct: d.vacancyPct ?? 5, maintenanceReservePct: d.maintenanceReservePct ?? 10, insurancePct: d.insurancePct ?? 0.5, taxPct: d.taxPct ?? 1.2 },
    ltvPercent,
    activeDealId: d.id,
  }
}

// ── List view ──────────────────────────────────────────────────────────────

function DealRow({ deal, onEdit, onDelete, onConvert, converting }: {
  deal: Deal
  onEdit: () => void
  onDelete: () => void
  onConvert: () => void
  converting: boolean
}) {
  const router = useRouter()
  const r = useMemo(() => computeProForma({
    purchasePrice: deal.purchasePrice, monthlyRent: deal.monthlyRent,
    financingType: deal.financingType, interestRate: deal.interestRate,
    loanAmount: deal.loanAmount, pmPercent: deal.pmPercent,
    vacancyPct: deal.vacancyPct, maintenanceReservePct: deal.maintenanceReservePct,
    insurancePct: deal.insurancePct, taxPct: deal.taxPct,
  }), [deal])
  const isConverted = deal.status === 'converted'

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900 text-sm">{deal.name}</p>
        {deal.address && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{deal.address}</p>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{PROPERTY_TYPES.find(t => t.value === deal.propertyType)?.label}</td>
      <td className="px-4 py-3 text-sm text-gray-900 tabular-nums">{formatCurrency(deal.purchasePrice, true)}</td>
      <td className="px-4 py-3 text-sm text-gray-900 tabular-nums">{formatCurrency(deal.monthlyRent)}/mo</td>
      <td className="px-4 py-3 text-sm tabular-nums">
        {r ? (
          <span className={r.lines.cashFlow >= 0 ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
            {formatCurrency(r.lines.cashFlow)}/mo
          </span>
        ) : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 tabular-nums">{r ? formatPercent(r.capRate) : '—'}</td>
      <td className="px-4 py-3">
        {r && <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${DECISION_STYLES[r.decision]}`}>{r.decision}</span>}
      </td>
      <td className="px-4 py-3">{r && <ScoreBadge score={r.score} size="sm" />}</td>
      <td className="px-4 py-3">
        {isConverted ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full whitespace-nowrap">Added to Portfolio</span>
            {deal.convertedPropertyId && (
              <button onClick={() => router.push(`/properties/${deal.convertedPropertyId}`)} className="text-xs text-brand-600 hover:underline whitespace-nowrap">
                View →
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Edit
            </button>
            <button onClick={onConvert} disabled={converting} className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors whitespace-nowrap">
              {converting ? 'Adding…' : 'Add to Portfolio'}
            </button>
            <button onClick={onDelete} className="px-2 py-1.5 text-xs text-red-400 hover:text-red-600 transition-colors">
              ✕
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

// ── Projection ────────────────────────────────────────────────────────────

function ProjectionSection({ inputs, result }: { inputs: ProFormaInputs; result: ProFormaResult }) {
  const projections: YearProjection[] = useMemo(
    () => computeProjection(inputs, result),
    [inputs, result]
  )
  const isAmortizing = inputs.financingType !== 'interest-only' && inputs.financingType !== 'cash'
  const yr5 = projections[4]
  const yr20 = projections[19]

  const barData = projections.slice(0, 5).map(p => ({
    year: `Yr ${p.year}`,
    cashFlow: Math.max(0, p.annualCashFlow),
    principal: isAmortizing ? p.principalPaydown : 0,
    appreciation: p.appreciationGain,
    roi: p.roi,
  }))

  const areaData = projections.map(p => ({
    year: p.year,
    return: p.cumulativeReturn,
  }))

  const fmt = (v: number) => formatCurrency(v, true)

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projection</p>
        <p className="text-xs text-gray-400">2% annual appreciation · rent held flat</p>
      </div>

      {/* Summary stats */}
      <div className="px-5 pt-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-gray-100">
        {[
          { label: '5-Yr Total Return', value: fmt(yr5.cumulativeReturn),  color: yr5.cumulativeReturn >= 0 ? 'text-gray-900' : 'text-red-600' },
          { label: '5-Yr ROI',          value: `${yr5.roi.toFixed(1)}%`,   color: yr5.roi >= 0 ? 'text-emerald-700' : 'text-red-600' },
          { label: '20-Yr Total Return',value: fmt(yr20.cumulativeReturn), color: yr20.cumulativeReturn >= 0 ? 'text-gray-900' : 'text-red-600' },
          { label: '20-Yr ROI',         value: `${yr20.roi.toFixed(1)}%`,  color: yr20.roi >= 0 ? 'text-emerald-700' : 'text-red-600' },
        ].map(s => (
          <div key={s.label}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
            <p className={`mt-1 text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="p-5">
        {/* 5-Year stacked bar chart */}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">5-Year Annual Return</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={fmt} axisLine={false} tickLine={false} width={56} />
            <Tooltip
              formatter={(value: unknown) => [fmt(value as number), '']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="cashFlow" name="Cash Flow" stackId="a" fill="#34d399" />
            {isAmortizing && <Bar dataKey="principal" name="Principal Paydown" stackId="a" fill="#60a5fa" />}
            <Bar dataKey="appreciation" name="Appreciation" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-2 mb-6 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
            <span className="text-xs text-gray-500">Cash Flow</span>
          </div>
          {isAmortizing && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" />
              <span className="text-xs text-gray-500">Principal Paydown</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-violet-400 inline-block" />
            <span className="text-xs text-gray-500">Appreciation</span>
          </div>
        </div>

        {/* 20-Year cumulative return area chart */}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Cumulative Return (20 Years)</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={areaData} margin={{ top: 4, right: 4, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="returnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              ticks={[1, 5, 10, 15, 20]} tickFormatter={v => `Yr ${v}`} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={fmt} axisLine={false} tickLine={false} width={56} />
            <ReferenceLine y={0} stroke="#d1d5db" />
            <Tooltip
              formatter={(v: unknown) => [fmt(v as number), 'Cumulative Return']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              labelFormatter={(v: unknown) => `Year ${v}`}
            />
            <Area type="monotone" dataKey="return" stroke="#10b981" strokeWidth={2} fill="url(#returnGrad)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
          </AreaChart>
        </ResponsiveContainer>

        {/* Table — 20 years */}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6">20-Year Table</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Year</th>
                <th className="text-right py-2 px-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Prop. Value</th>
                <th className="text-right py-2 px-2 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider whitespace-nowrap">Cash Flow</th>
                {isAmortizing && <th className="text-right py-2 px-2 text-[10px] font-semibold text-blue-500 uppercase tracking-wider whitespace-nowrap">Principal</th>}
                <th className="text-right py-2 px-2 text-[10px] font-semibold text-orange-500 uppercase tracking-wider whitespace-nowrap">Interest Paid</th>
                <th className="text-right py-2 px-2 text-[10px] font-semibold text-violet-500 uppercase tracking-wider whitespace-nowrap">Appreciation</th>
                <th className="text-right py-2 px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Yr Return</th>
                <th className="text-right py-2 px-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Cumul. Return</th>
                <th className="text-right py-2 pl-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Cumul. ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projections.map(p => (
                <tr key={p.year} className={`hover:bg-gray-50 ${p.year === 5 || p.year === 10 || p.year === 20 ? 'bg-gray-50/60' : ''}`}>
                  <td className="py-2.5 pr-3 font-medium text-gray-700 text-sm">Year {p.year}</td>
                  <td className="py-2.5 px-2 text-right text-gray-600 tabular-nums text-sm">{formatCurrency(p.propertyValue, true)}</td>
                  <td className={`py-2.5 px-2 text-right tabular-nums text-sm font-medium ${p.annualCashFlow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {formatCurrency(p.annualCashFlow, true)}
                  </td>
                  {isAmortizing && (
                    <td className="py-2.5 px-2 text-right text-blue-600 tabular-nums text-sm">{formatCurrency(p.principalPaydown, true)}</td>
                  )}
                  <td className="py-2.5 px-2 text-right text-orange-500 tabular-nums text-sm">{formatCurrency(p.interestPaid, true)}</td>
                  <td className="py-2.5 px-2 text-right text-violet-600 tabular-nums text-sm">{formatCurrency(p.appreciationGain, true)}</td>
                  <td className="py-2.5 px-2 text-right font-semibold text-gray-900 tabular-nums text-sm">{formatCurrency(p.totalReturn, true)}</td>
                  <td className={`py-2.5 px-2 text-right font-semibold tabular-nums text-sm ${p.cumulativeReturn >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                    {formatCurrency(p.cumulativeReturn, true)}
                  </td>
                  <td className={`py-2.5 pl-2 text-right tabular-nums text-sm font-bold ${p.roi >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {p.roi.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Detail/edit view ───────────────────────────────────────────────────────

function DealDetail({ form, setForm, result, onBack, onSave, onConvert, saving, saveFeedback, converting }: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  result: ProFormaResult | null
  onBack: () => void
  onSave: () => void
  onConvert: () => void
  saving: boolean
  saveFeedback: boolean
  converting: boolean
}) {
  function setMeta<K extends keyof Omit<FormState, 'inputs' | 'ltvPercent' | 'activeDealId'>>(
    key: K, value: FormState[K]
  ) { setForm(prev => ({ ...prev, [key]: value })) }

  function setInput<K extends keyof ProFormaInputs>(key: K, value: ProFormaInputs[K]) {
    setForm(prev => {
      const next = { ...prev, inputs: { ...prev.inputs, [key]: value } }
      if (key === 'purchasePrice') {
        next.inputs.loanAmount = (value as number) * prev.ltvPercent / 100
      }
      if (key === 'financingType' && value !== 'cash') {
        next.inputs.loanAmount = prev.inputs.purchasePrice * prev.ltvPercent / 100
      }
      return next
    })
  }

  function setLtv(ltv: number) {
    setForm(prev => ({
      ...prev,
      ltvPercent: ltv,
      inputs: { ...prev.inputs, loanAmount: prev.inputs.purchasePrice * ltv / 100 },
    }))
  }

  const financed = form.inputs.financingType !== 'cash'
  const hasName = form.name.trim().length > 0
  const price5 = useMemo(() => solveMaxPurchasePrice(form.inputs, 20, form.ltvPercent), [form.inputs, form.ltvPercent])
  const price4 = useMemo(() => solveMaxPurchasePrice(form.inputs, 10, form.ltvPercent), [form.inputs, form.ltvPercent])
  const rentFor5 = useMemo(() => solveMinMonthlyRent(form.inputs, 20), [form.inputs])
  const rentFor4 = useMemo(() => solveMinMonthlyRent(form.inputs, 10), [form.inputs])

  function applyPrice(price: number) {
    setForm(prev => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        purchasePrice: price,
        loanAmount: prev.inputs.financingType !== 'cash' ? price * prev.ltvPercent / 100 : 0,
      },
    }))
  }

  return (
    <div>
      <Header
        title={form.activeDealId ? form.name || 'Edit Deal' : 'New Deal'}
        subtitle={form.activeDealId ? 'Edit deal details' : 'Analyze a potential acquisition'}
        actions={
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            ← All Deals
          </button>
        }
      />
      <PageContainer>
        {/* Action bar */}
        <div className="flex items-center justify-between gap-4 bg-white rounded-2xl shadow-card px-5 py-3 mb-6 flex-wrap gap-y-2">
          <div className="min-w-0">
            {hasName
              ? <p className="text-sm font-semibold text-gray-900 truncate">{form.name}</p>
              : <p className="text-sm text-gray-400">Enter a property name to save or add to portfolio</p>
            }
          </div>
          <div className="flex gap-2 shrink-0">
            {result && (
              <button
                onClick={() => printDeal(form, result)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
                Print
              </button>
            )}
            <button
              onClick={onSave}
              disabled={saving || !hasName}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 border ${
                saveFeedback
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {saveFeedback ? '✓ Saved' : saving ? 'Saving…' : form.activeDealId ? 'Update Deal' : 'Save Deal'}
            </button>
            <button
              onClick={onConvert}
              disabled={converting || !hasName}
              className="px-4 py-2 text-sm font-semibold text-white bg-brand-500 rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm"
            >
              {converting ? 'Adding…' : 'Add to Portfolio'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">

          {/* Left: Inputs */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
              <h3 className="text-sm font-semibold text-gray-700">Property Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Property Name" value={form.name} onChange={e => setMeta('name', e.target.value)} placeholder="123 Main St" required />
                <FormField label="Address" value={form.address} onChange={e => setMeta('address', e.target.value)} placeholder="123 Main St, City, ST" />
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Property Type</label>
                  <select value={form.propertyType} onChange={e => setMeta('propertyType', e.target.value as PropertyType)} className={selectClass}>
                    {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <FormField label="Units" type="number" min="1" value={form.units} onChange={e => setMeta('units', parseInt(e.target.value) || 1)} />
                <FormField label="Square Footage" type="number" value={form.sqft ?? ''} onChange={e => setMeta('sqft', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Optional" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
              <h3 className="text-sm font-semibold text-gray-700">Financials</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CurrencyInput label="Purchase Price" value={form.inputs.purchasePrice} onChange={v => setInput('purchasePrice', v)} />
                <CurrencyInput label="Expected Monthly Rent" value={form.inputs.monthlyRent} onChange={v => setInput('monthlyRent', v)} />
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Financing</label>
                  <select value={form.inputs.financingType} onChange={e => setInput('financingType', e.target.value as FinancingType)} className={selectClass}>
                    {FINANCING_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Property Management</label>
                  <div className="relative">
                    <input type="number" min="0" max="30" step="0.5" value={form.inputs.pmPercent}
                      onChange={e => setInput('pmPercent', parseFloat(e.target.value) || 0)}
                      className="w-full pr-8 px-4 py-3 text-[15px] bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[15px] font-medium">%</span>
                  </div>
                </div>
              </div>

              {financed && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-gray-100">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Loan to Value</label>
                    <select value={form.ltvPercent} onChange={e => setLtv(parseInt(e.target.value))} className={selectClass}>
                      {LTV_OPTIONS.map(ltv => (
                        <option key={ltv} value={ltv}>{ltv}%</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Loan Amount</label>
                    <div className="px-4 py-3 text-[15px] bg-gray-50 rounded-xl border border-gray-200 text-gray-700 tabular-nums">
                      {formatCurrency(form.inputs.loanAmount)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Interest Rate</label>
                    <div className="relative">
                      <input type="number" min="0" max="20" step="0.125" value={form.inputs.interestRate}
                        onChange={e => setInput('interestRate', parseFloat(e.target.value) || 0)}
                        className="w-full pr-8 px-4 py-3 text-[15px] bg-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[15px] font-medium">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Assumptions</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { label: 'Vacancy', key: 'vacancyPct', sub: '% of rent', step: 0.5, min: 0, max: 30 },
                  { label: 'Maint. Reserve', key: 'maintenanceReservePct', sub: '% of rent (advisory)', step: 0.5, min: 0, max: 30 },
                  { label: 'Insurance', key: 'insurancePct', sub: '% of price/yr', step: 0.05, min: 0, max: 5 },
                  { label: 'Property Tax', key: 'taxPct', sub: '% of price/yr', step: 0.05, min: 0, max: 5 },
                ] as const).map(({ label, key, sub, step, min, max }) => (
                  <div key={key} className="flex flex-col gap-1">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                    <div className="relative">
                      <input
                        type="number" min={min} max={max} step={step}
                        value={form.inputs[key]}
                        onChange={e => setInput(key, parseFloat(e.target.value) || 0)}
                        className="w-full pr-6 pl-2 py-1.5 text-sm bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                    </div>
                    <p className="text-[10px] text-gray-400">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:sticky lg:top-[65px] space-y-4">
            {!result ? (
              <div className="bg-white rounded-2xl shadow-card p-8 text-center text-gray-400">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 mx-auto mb-3 text-gray-200">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
                <p className="text-sm font-medium">Enter a purchase price and expected rent to see the analysis</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl shadow-card p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pro-Forma Score</p>
                      <div className="flex items-center gap-3">
                        <ScoreBadge score={result.score} size="lg" />
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${DECISION_STYLES[result.decision]}`}>
                          {result.decision}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {result.lines.monthlyPrincipal > 0 ? 'Actual Cash Flow' : 'Cash Flow'}
                      </p>
                      <p className={`text-2xl font-bold ${result.lines.actualCashFlow >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {formatCurrency(result.lines.actualCashFlow)}<span className="text-sm font-medium text-gray-400">/mo</span>
                      </p>
                      <p className={`text-xs font-semibold mt-0.5 ${result.cashFlowMargin >= 20 ? 'text-emerald-600' : result.cashFlowMargin >= 10 ? 'text-green-600' : result.cashFlowMargin >= 5 ? 'text-amber-500' : 'text-red-500'}`}>
                        {result.cashFlowMargin.toFixed(1)}% rent margin
                      </p>
                    </div>
                  </div>
                  <MetricBar value={result.score} max={5} />
                  <p className="mt-3 text-sm text-gray-500 leading-relaxed">{DECISION_CONTEXT[result.decision]}</p>
                  {((price5 && result.score < 5) || (price4 && result.score < 4) || (rentFor5 && result.score < 5) || (rentFor4 && result.score < 4)) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                      {((price5 && result.score < 5) || (price4 && result.score < 4)) && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Max Price to Achieve</p>
                          <div className="space-y-1">
                            {price5 && result.score < 5 && (
                              <button
                                onClick={() => applyPrice(price5)}
                                className="w-full flex justify-between items-center px-2 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors group"
                              >
                                <span className="text-xs text-gray-500 group-hover:text-emerald-700">Score 5 · Strong Buy</span>
                                <span className="text-xs font-bold text-emerald-600">{formatCurrency(price5)}</span>
                              </button>
                            )}
                            {price4 && result.score < 4 && (
                              <button
                                onClick={() => applyPrice(price4)}
                                className="w-full flex justify-between items-center px-2 py-1.5 rounded-lg hover:bg-green-50 transition-colors group"
                              >
                                <span className="text-xs text-gray-500 group-hover:text-green-700">Score 4 · Buy</span>
                                <span className="text-xs font-bold text-green-600">{formatCurrency(price4)}</span>
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 px-2">Click to apply price</p>
                        </div>
                      )}
                      {((rentFor5 && result.score < 5 && rentFor5 > form.inputs.monthlyRent) || (rentFor4 && result.score < 4 && rentFor4 > form.inputs.monthlyRent)) && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Min Rent to Achieve</p>
                          <div className="space-y-1">
                            {rentFor5 && result.score < 5 && rentFor5 > form.inputs.monthlyRent && (
                              <button
                                onClick={() => setInput('monthlyRent', rentFor5)}
                                className="w-full flex justify-between items-center px-2 py-1.5 rounded-lg hover:bg-teal-50 transition-colors group"
                              >
                                <span className="text-xs text-gray-500 group-hover:text-teal-700">Score 5 · Strong Buy</span>
                                <span className="text-xs font-bold text-teal-600">{formatCurrency(rentFor5)}/mo</span>
                              </button>
                            )}
                            {rentFor4 && result.score < 4 && rentFor4 > form.inputs.monthlyRent && (
                              <button
                                onClick={() => setInput('monthlyRent', rentFor4)}
                                className="w-full flex justify-between items-center px-2 py-1.5 rounded-lg hover:bg-teal-50 transition-colors group"
                              >
                                <span className="text-xs text-gray-500 group-hover:text-teal-700">Score 4 · Buy</span>
                                <span className="text-xs font-bold text-teal-600">{formatCurrency(rentFor4)}/mo</span>
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 px-2">Click to apply rent</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Cap Rate', value: formatPercent(result.capRate), sub: 'NOI / purchase price' },
                    { label: 'Cash-on-Cash', value: formatPercent(result.cashOnCash), sub: 'Annual CF / cash in', colored: true, raw: result.cashOnCash },
                    { label: 'Annual NOI', value: formatCurrency(result.annualNOI, true), sub: 'Before debt service' },
                    { label: result.lines.monthlyPrincipal > 0 ? 'Actual Annual CF' : 'Annual Cash Flow', value: formatCurrency(result.lines.actualCashFlow * 12, true), sub: result.lines.monthlyPrincipal > 0 ? 'Cash flow + principal' : 'After debt service', colored: true, raw: result.lines.actualCashFlow },
                  ].map(m => (
                    <div key={m.label} className="bg-white rounded-2xl shadow-card p-4">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{m.label}</p>
                      <p className={`mt-1 text-lg font-bold ${m.colored ? (m.raw! >= 0 ? 'text-emerald-700' : 'text-red-600') : 'text-gray-900'}`}>{m.value}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{m.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Pro-Forma</p>
                  </div>
                  <div className="px-5 divide-y divide-gray-100">
                    <WaterfallRow label="Gross Rent" value={result.lines.grossRent} bold />
                    <WaterfallRow label={`Vacancy (${form.inputs.vacancyPct}%)`} value={result.lines.vacancy} indent />
                    <WaterfallRow label="Effective Income" value={result.lines.effectiveIncome} bold />
                    <WaterfallRow label={`Property Mgmt (${form.inputs.pmPercent}%)`} value={result.lines.pmFee} indent />
                    <WaterfallRow label={`Insurance (${form.inputs.insurancePct}% / yr)`} value={result.lines.insurance} indent />
                    <WaterfallRow label={`Property Taxes (${form.inputs.taxPct}% / yr)`} value={result.lines.taxes} indent />
                    <WaterfallRow label="Net Operating Income" value={result.lines.noi} bold />
                    <WaterfallRow label={financed ? `Debt Service (${form.ltvPercent}% LTV)` : 'Debt Service'} value={result.lines.debtService} indent />
                    <WaterfallRow label="Monthly Cash Flow" value={result.lines.cashFlow} bold colored />
                    {result.lines.monthlyPrincipal > 0 && (
                      <WaterfallRow label="Principal Paydown (mo. 1)" value={result.lines.monthlyPrincipal} additive />
                    )}
                    {result.lines.monthlyPrincipal > 0 && (
                      <WaterfallRow label="Actual Cash Flow" value={result.lines.actualCashFlow} bold colored />
                    )}
                    {result.lines.maintenanceReserve > 0 && (
                      <WaterfallRow label={`Maintenance Reserve (${form.inputs.maintenanceReservePct}% — set aside)`} value={result.lines.maintenanceReserve} advisory />
                    )}
                  </div>
                </div>

              </>
            )}
          </div>
        </div>

        {result && <ProjectionSection inputs={form.inputs} result={result} />}
      </PageContainer>
    </div>
  )
}

// ── Root component ─────────────────────────────────────────────────────────

export default function DealAnalyzer() {
  const router = useRouter()
  const { createProperty } = useProperties()
  const { deals, loading, createDeal, updateDeal, deleteDeal } = useDeals()

  const [view, setView] = useState<'list' | 'detail'>('list')
  const [form, setForm] = useState<FormState>(BLANK)
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState<string | null>(null)
  const [saveFeedback, setSaveFeedback] = useState(false)

  const result = useMemo(() => computeProForma(form.inputs), [form.inputs])

  function openNew() {
    setForm(BLANK)
    setSaveFeedback(false)
    setView('detail')
  }

  function openEdit(deal: Deal) {
    setForm(dealToFormState(deal))
    setSaveFeedback(false)
    setView('detail')
  }

  function goBack() {
    setView('list')
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(), address: form.address, propertyType: form.propertyType,
        units: form.units, sqft: form.sqft,
        purchasePrice: form.inputs.purchasePrice, monthlyRent: form.inputs.monthlyRent,
        financingType: form.inputs.financingType, interestRate: form.inputs.interestRate,
        loanAmount: form.inputs.loanAmount, pmPercent: form.inputs.pmPercent,
        vacancyPct: form.inputs.vacancyPct ?? 5, maintenanceReservePct: form.inputs.maintenanceReservePct ?? 10,
        insurancePct: form.inputs.insurancePct ?? 0.5, taxPct: form.inputs.taxPct ?? 1.2,
        status: 'active' as const,
      }
      if (form.activeDealId) {
        await updateDeal(form.activeDealId, payload)
      } else {
        const created = await createDeal(payload)
        setForm(prev => ({ ...prev, activeDealId: created.id }))
      }
      setSaveFeedback(true)
      setTimeout(() => setSaveFeedback(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleConvertForm() {
    const useName = form.name.trim()
    if (!useName || !result) return
    const targetId = form.activeDealId
    setConverting(targetId ?? 'inline')
    try {
      const price = form.inputs.purchasePrice
      const created = await createProperty({
        name: useName, address: form.address,
        propertyType: form.propertyType,
        units: form.units, sqft: form.sqft,
        purchasePrice: price, estimatedCurrentValue: price,
        acquisitionDate: new Date().toISOString().slice(0, 10),
        notes: `Pro-forma: ${result.decision}. Cap rate ${formatPercent(result.capRate)}, CoC ${formatPercent(result.cashOnCash)}.`,
      })
      if (targetId) {
        await updateDeal(targetId, { status: 'converted', convertedPropertyId: created.id })
      }
      router.push(`/properties/${created.id}`)
    } finally {
      setConverting(null)
    }
  }

  async function handleConvertDeal(deal: Deal) {
    setConverting(deal.id)
    try {
      const r = computeProForma({
        purchasePrice: deal.purchasePrice, monthlyRent: deal.monthlyRent,
        financingType: deal.financingType, interestRate: deal.interestRate,
        loanAmount: deal.loanAmount, pmPercent: deal.pmPercent,
        vacancyPct: deal.vacancyPct, maintenanceReservePct: deal.maintenanceReservePct,
        insurancePct: deal.insurancePct, taxPct: deal.taxPct,
      })
      const created = await createProperty({
        name: deal.name, address: deal.address,
        propertyType: deal.propertyType,
        units: deal.units, sqft: deal.sqft,
        purchasePrice: deal.purchasePrice, estimatedCurrentValue: deal.purchasePrice,
        acquisitionDate: new Date().toISOString().slice(0, 10),
        notes: r ? `Pro-forma: ${r.decision}. Cap rate ${formatPercent(r.capRate)}, CoC ${formatPercent(r.cashOnCash)}.` : '',
      })
      await updateDeal(deal.id, { status: 'converted', convertedPropertyId: created.id })
      router.push(`/properties/${created.id}`)
    } finally {
      setConverting(null)
    }
  }

  if (view === 'detail') {
    return (
      <DealDetail
        form={form}
        setForm={setForm}
        result={result}
        onBack={goBack}
        onSave={handleSave}
        onConvert={handleConvertForm}
        saving={saving}
        saveFeedback={saveFeedback}
        converting={converting === (form.activeDealId ?? 'inline')}
      />
    )
  }

  // List view
  return (
    <div>
      <Header
        title="Deal Analyzer"
        subtitle="Track and evaluate potential acquisitions"
        actions={
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            New Deal
          </button>
        }
      />
      <PageContainer>
        {loading ? (
          <div className="flex justify-center py-16 text-gray-400 text-sm">Loading…</div>
        ) : deals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 mx-auto mb-4 text-gray-200">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            <p className="text-gray-500 font-medium mb-1">No deals yet</p>
            <p className="text-gray-400 text-sm mb-5">Analyze a potential acquisition and save it here for reference.</p>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors"
            >
              Analyze a Deal
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Deal', 'Type', 'Purchase Price', 'Monthly Rent', 'Cash Flow', 'Cap Rate', 'Decision', 'Score', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deals.map(deal => (
                    <DealRow
                      key={deal.id}
                      deal={deal}
                      onEdit={() => openEdit(deal)}
                      onDelete={() => deleteDeal(deal.id)}
                      onConvert={() => handleConvertDeal(deal)}
                      converting={converting === deal.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
