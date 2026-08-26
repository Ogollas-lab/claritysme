import { strict as assert } from "node:assert";
import { calculateKPISnapshot, buildKPICards, formatCurrency } from "../kpi";
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
    description: "Website retainer",
    amount: 20000,
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
    category: "payroll",
    description: "Team payroll",
    amount: 6000,
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
    category: "software_subscriptions",
    description: "SaaS expense",
    amount: 1000,
    currency: "USD",
    source: "manual",
    created_at: "2026-08-03T00:00:00.000Z",
  },
];

const snapshot = calculateKPISnapshot(records, 8, 2026, 4, 15000, 18000);
assert.equal(snapshot.total_revenue, 20000);
assert.equal(snapshot.total_payroll, 6000);
assert.equal(snapshot.gross_profit, 20000 - 0);
assert.ok(snapshot.gross_margin_pct >= 0);
assert.equal(formatCurrency(1200, "USD"), "$1.2K");

const cards = buildKPICards({ ...snapshot, id: "s1", company_id: "c1", created_at: "2026-08-01T00:00:00.000Z" }, "USD");
assert.equal(cards.length, 6);
assert.ok(cards[0].formattedValue.includes("$") || cards[0].formattedValue.includes("$"));
console.log("KPI smoke test passed");
