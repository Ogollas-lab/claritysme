import type { FinancialRecord, ForecastPoint, CashFlowForecast, RevenueForecast } from "@/types";

// Lightweight local implementations to avoid dependency on ./kpi when not available.
function filterByPeriod(records: FinancialRecord[], month: number, year: number): FinancialRecord[] {
  return records.filter(r => { const d = new Date(r.date); return d.getMonth() + 1 === month && d.getFullYear() === year; });
}

function sumByCategories(records: FinancialRecord[], categories: readonly string[]): number {
  return records.reduce((sum, r) => sum + (categories.includes((r as any).category) ? ((r as any).amount ?? 0) : 0), 0);
}

const REVENUE_CATS = ["revenue_service","revenue_product","revenue_recurring","revenue_one_time","other_income"] as const;
const EXPENSE_CATS = ["cogs_labour","cogs_materials","cogs_contractors","cogs_other","payroll","rent_facilities","software_subscriptions","marketing_advertising","professional_services","utilities","travel_entertainment","depreciation","other_expense"] as const;

function addDays(date: Date, days: number): Date { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function addMonths(date: Date, months: number): Date { const d = new Date(date); d.setMonth(d.getMonth() + months); return d; }
function toISO(d: Date) { return d.toISOString().slice(0, 10); }
function ewma(values: number[], alpha = 0.3): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v, i) => i === 0 ? v : alpha * v + (1 - alpha) * acc);
}
function linearRegression(y: number[]): { slope: number; intercept: number } {
  const n = y.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const x = Array.from({ length: n }, (_, i) => i);
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  const num = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
  const den = x.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0);
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: yMean - slope * xMean };
}
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1));
}

export function buildMonthlyRevenueSeries(records: FinancialRecord[], months: number = 12): Array<{ month: number; year: number; revenue: number; expenses: number }> {
  const now = new Date();
  const series = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = addMonths(now, -i);
    const mon = d.getMonth() + 1;
    const yr = d.getFullYear();
    const pr = filterByPeriod(records, mon, yr);
    series.push({
      month: mon, year: yr,
      revenue: sumByCategories(pr, REVENUE_CATS as unknown as Parameters<typeof sumByCategories>[1]),
      expenses: sumByCategories(pr, EXPENSE_CATS as unknown as Parameters<typeof sumByCategories>[1]),
    });
  }
  return series;
}

export function generate13WeekCashFlow(records: FinancialRecord[], openingBalance: number, companyId: string): CashFlowForecast {
  const now = new Date();
  const weeklyActuals: Array<{ cashIn: number; cashOut: number }> = [];
  for (let w = 11; w >= 0; w--) {
    const wStart = addDays(now, -w * 7 - 7);
    const wEnd = addDays(now, -w * 7);
    const wRecs = records.filter(r => { const d = new Date(r.date); return d >= wStart && d < wEnd; });
    weeklyActuals.push({
      cashIn: sumByCategories(wRecs, REVENUE_CATS as unknown as Parameters<typeof sumByCategories>[1]),
      cashOut: sumByCategories(wRecs, EXPENSE_CATS as unknown as Parameters<typeof sumByCategories>[1]),
    });
  }
  const avgCashIn = ewma(weeklyActuals.map(w => w.cashIn));
  const avgCashOut = ewma(weeklyActuals.map(w => w.cashOut));
  const inSD = stdDev(weeklyActuals.map(w => w.cashIn));
  const outSD = stdDev(weeklyActuals.map(w => w.cashOut));

  let balance = openingBalance;
  const weeks: ForecastPoint[] = [];
  let lowestBalance = balance;
  let lowestBalanceDate = toISO(now);

  for (let w = 0; w < 13; w++) {
    const weekStart = addDays(now, w * 7);
    const seasonalFactor = [0.92,1.08,1.0,0.98,1.05,1.02,0.95,1.03,1.0,0.98,1.04,1.01,0.99][w];
    const projIn = avgCashIn * seasonalFactor;
    const projOut = avgCashOut;
    const net = projIn - projOut;
    balance += net;
    if (balance < lowestBalance) { lowestBalance = balance; lowestBalanceDate = toISO(weekStart); }
    weeks.push({
      date: toISO(weekStart), predicted: Math.max(0, balance),
      lower: Math.max(0, balance - inSD * 1.28 - outSD * 1.28),
      upper: balance + inSD * 1.28,
      cashIn: Math.round(projIn), cashOut: Math.round(projOut),
      netCash: Math.round(net), closingBalance: Math.round(balance),
      status: balance > 0 && net >= 0 ? "green" : balance > avgCashOut * 2 ? "amber" : "red",
    });
  }

  const runwayWeeks = avgCashOut > avgCashIn ? Math.max(0, openingBalance / (avgCashOut - avgCashIn) / 7) : Infinity;
  return {
    companyId, generatedAt: now.toISOString(), openingBalance, weeks,
    summary: {
      lowestBalance: Math.round(lowestBalance), lowestBalanceDate,
      runwayWeeks: isFinite(runwayWeeks) ? Math.round(runwayWeeks) : 999,
      avgWeeklyCashIn: Math.round(avgCashIn), avgWeeklyCashOut: Math.round(avgCashOut),
    },
  };
}

export function generate12MonthForecast(records: FinancialRecord[], companyId: string, monthsAhead = 12): RevenueForecast {
  const now = new Date();
  const series = buildMonthlyRevenueSeries(records, 12);
  const revenueHistory = series.map(s => s.revenue);
  const { slope, intercept } = linearRegression(revenueHistory);
  const sd = stdDev(revenueHistory);
  const n = revenueHistory.length;

  const makeScenario = (multiplier: number): ForecastPoint[] =>
    Array.from({ length: monthsAhead }, (_, i) => {
      const predicted = Math.max(0, (intercept + slope * (n + i)) * multiplier);
      return { date: toISO(addMonths(now, i + 1)), predicted: Math.round(predicted), lower: Math.round(Math.max(0, predicted - sd * 1.28)), upper: Math.round(predicted + sd * 1.28) };
    });

  const base = makeScenario(1);
  const optimistic = makeScenario(1.2);
  const conservative = makeScenario(0.8);
  const annualTarget = base.find(p => p.predicted * 12 >= 1_000_000);
  const projectedARR = (base.at(-1)?.predicted ?? 0) * 12;

  const actuals: ForecastPoint[] = series.slice(-6).map(s => ({
    date: `${s.year}-${String(s.month).padStart(2,"0")}-01`,
    predicted: s.revenue, lower: s.revenue, upper: s.revenue, isActual: true,
  }));

  return {
    companyId, generatedAt: now.toISOString(),
    months: [...actuals, ...base],
    scenarios: { base, optimistic, conservative },
    projectedARR: Math.round(projectedARR),
    projectedARRDate: annualTarget?.date ?? toISO(addMonths(now, monthsAhead)),
  };
}

export interface ForecastAlert {
  type: "negative_balance"|"high_burn"|"declining_revenue"|"low_runway";
  severity: "critical"|"warning"|"info";
  message: string;
  weekOrMonth: string;
}

export function detectForecastAlerts(cf: CashFlowForecast, rf: RevenueForecast): ForecastAlert[] {
  const alerts: ForecastAlert[] = [];
  const negWeeks = cf.weeks.filter(w => (w.closingBalance ?? 0) < 0);
  if (negWeeks.length > 0) alerts.push({ type:"negative_balance", severity:"critical", message:`Projected negative cash balance starting ${negWeeks[0].date}`, weekOrMonth: negWeeks[0].date });

  const forecastMonths = rf.scenarios.base;
  let declining = 0;
  for (let i = 1; i < forecastMonths.length; i++) {
    if (forecastMonths[i].predicted < forecastMonths[i-1].predicted) declining++;
    else declining = 0;
    if (declining >= 3) { alerts.push({ type:"declining_revenue", severity:"warning", message:"Revenue forecast declining for 3+ consecutive months", weekOrMonth: forecastMonths[i].date }); break; }
  }

  if (cf.summary.runwayWeeks < 12 && cf.summary.runwayWeeks < 999) {
    alerts.push({ type:"low_runway", severity: cf.summary.runwayWeeks < 6 ? "critical" : "warning", message:`Only ${cf.summary.runwayWeeks} weeks of runway at current burn rate`, weekOrMonth: toISO(new Date()) });
  }
  return alerts;
}