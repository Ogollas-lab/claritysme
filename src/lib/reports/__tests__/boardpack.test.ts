import { strict as assert } from "node:assert";
import { generateBoardpack } from "../boardpack";
import type { Company, KPISnapshot, FinancialRecord } from "@/types";

const company: Company = {
  id: "c1",
  owner_id: "u1",
  name: "Northstar Studio",
  industry: "marketing_agency",
  country: "US",
  currency: "USD",
  revenue_band: "1M-5M",
  revenue_model: "retainer",
  headcount: 8,
  fiscal_year_start_month: 1,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-08-20T00:00:00.000Z",
  onboarding_completed: true,
  logo_url: null,
  stripe_customer_id: null,
};

const snapshot: KPISnapshot = {
  id: "s1",
  company_id: "c1",
  period_month: 8,
  period_year: 2026,
  total_revenue: 125000,
  recurring_revenue: 85000,
  one_time_revenue: 40000,
  total_cogs: 30000,
  total_opex: 50000,
  total_payroll: 42000,
  gross_profit: 95000,
  gross_margin_pct: 76,
  ebitda: 45000,
  ebitda_margin_pct: 36,
  net_profit: 45000,
  net_margin_pct: 36,
  cash_balance: 180000,
  burn_rate: -15000,
  runway_months: 9,
  revenue_per_employee: 15625,
  payroll_ratio_pct: 33.6,
  mom_revenue_growth_pct: 12.5,
  arr: 1020000,
  mrr: 85000,
  created_at: "2026-08-20T00:00:00.000Z",
};

const records: FinancialRecord[] = [
  {
    id: "r1",
    company_id: "c1",
    date: "2026-08-01",
    period_month: 8,
    period_year: 2026,
    type: "income",
    category: "revenue_recurring",
    description: "Retainer income",
    amount: 85000,
    currency: "USD",
    source: "manual",
    created_at: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "r2",
    company_id: "c1",
    date: "2026-08-02",
    period_month: 8,
    period_year: 2026,
    type: "expense",
    category: "payroll",
    description: "Staff payroll",
    amount: 42000,
    currency: "USD",
    source: "manual",
    created_at: "2026-08-02T00:00:00.000Z",
  },
];

const report = generateBoardpack(company, records, snapshot, "August 2026");
assert.equal(report.companyName, "Northstar Studio");
assert.equal(report.sections.length, 3);
assert.ok(report.highlights.length >= 3);
console.log("Boardpack smoke test passed");
