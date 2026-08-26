import { strict as assert } from "node:assert";
import { generate13WeekCashFlow, generate12MonthForecast, detectForecastAlerts } from "../forecast";
import type { FinancialRecord } from "@/types";

const records: FinancialRecord[] = [
  {
    id: "1",
    company_id: "c1",
    date: "2026-08-01",
    period_month: 8,
    period_year: 2026,
    type: "income",
    category: "revenue_service",
    description: "Invoice",
    amount: 2000,
    currency: "USD",
    source: "manual",
    created_at: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "2",
    company_id: "c1",
    date: "2026-08-02",
    period_month: 8,
    period_year: 2026,
    type: "expense",
    category: "software_subscriptions",
    description: "Software",
    amount: 500,
    currency: "USD",
    source: "manual",
    created_at: "2026-08-02T00:00:00.000Z",
  },
  {
    id: "3",
    company_id: "c1",
    date: "2026-08-03",
    period_month: 8,
    period_year: 2026,
    type: "expense",
    category: "payroll",
    description: "Payroll",
    amount: 800,
    currency: "USD",
    source: "manual",
    created_at: "2026-08-03T00:00:00.000Z",
  }
];

const cf = generate13WeekCashFlow(records, 5000, "c1");
assert.equal(cf.weeks.length, 13);
assert.ok(cf.summary.avgWeeklyCashIn >= 0);

const rf = generate12MonthForecast(records, "c1", 6);
assert.equal(rf.months.length >= 6, true);
assert.ok(rf.projectedARR >= 0);

const alerts = detectForecastAlerts(cf, rf);
assert.ok(Array.isArray(alerts));
console.log("Forecast smoke test passed");
