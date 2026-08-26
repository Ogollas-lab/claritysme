import { strict as assert } from "node:assert";
import { generateAlerts } from "../alerts";
import type { KPISnapshot, Company } from "@/types";

const snap: KPISnapshot = {
  id: "s1",
  company_id: "c1",
  period_month: 8,
  period_year: 2026,
  total_revenue: 20000,
  recurring_revenue: 15000,
  one_time_revenue: 5000,
  total_cogs: 4000,
  total_opex: 6000,
  total_payroll: 8000,
  gross_profit: 16000,
  gross_margin_pct: 80,
  ebitda: 12000,
  ebitda_margin_pct: 60,
  net_profit: 12000,
  net_margin_pct: 60,
  cash_balance: 25000,
  burn_rate: -6000,
  runway_months: 12,
  revenue_per_employee: 5000,
  payroll_ratio_pct: 40,
  mom_revenue_growth_pct: -8,
  arr: 180000,
  mrr: 15000,
  created_at: "2026-08-01T00:00:00.000Z",
};

const company: Company = {
  id: "c1",
  owner_id: "u1",
  name: "Acme",
  industry: "marketing_agency",
  country: "US",
  currency: "USD",
  revenue_band: "1M-5M",
  revenue_model: "retainer",
  headcount: 4,
  fiscal_year_start_month: 1,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
  onboarding_completed: true,
  logo_url: null,
  stripe_customer_id: null,
};

const alerts = generateAlerts(snap, company);
assert.ok(Array.isArray(alerts));
assert.ok(alerts.length >= 0);
console.log("Alerts smoke test passed");
