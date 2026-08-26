import type { FinancialRecord, ForecastPoint, CashFlowForecast, RevenueForecast } from "@/types";

function filterByPeriod(records: FinancialRecord[], month: number, year: number): FinancialRecord[] {
  return records.filter((record) => {
    const date = new Date(record.date);
    return date.getMonth() + 1 === month && date.getFullYear() === year;
  });
}

function sumByCategories(records: FinancialRecord[], categories: readonly string[]): number {
  return records.reduce((sum, record) => {
    return categories.includes(record.category) ? sum + record.amount : sum;
  }, 0);
}

const REVENUE_CATS = [
  "revenue_service",
  "revenue_product",
  "revenue_recurring",
  "revenue_one_time",
  "other_income",
] as const;

const EXPENSE_CATS = [
  "cogs_labour",
  "cogs_materials",
  "cogs_contractors",
  "cogs_other",
  "payroll",
  "rent_facilities",
  "software_subscriptions",
  "marketing_advertising",
  "professional_services",
  "utilities",
  "travel_entertainment",
  "depreciation",
  "other_expense",
] as const;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function ewma(values: number[], alpha = 0.3): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, value, index) => {
    if (index === 0) return value;
    return alpha * value + (1 - alpha) * acc;
  }, 0);
}

function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  const x = Array.from({ length: n }, (_, index) => index);
  const xMean = x.reduce((sum, value) => sum + value, 0) / n;
  const yMean = values.reduce((sum, value) => sum + value, 0) / n;

  const numerator = x.reduce((sum, xi, index) => sum + (xi - xMean) * (values[index] - yMean), 0);
  const denominator = x.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0);
  const slope = denominator === 0 ? 0 : numerator / denominator;

  return { slope, intercept: yMean - slope * xMean };
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
}

export function buildMonthlyRevenueSeries(
  records: FinancialRecord[],
  months = 12,
): Array<{ month: number; year: number; revenue: number; expenses: number }> {
  const now = new Date();
  const series = [] as Array<{ month: number; year: number; revenue: number; expenses: number }>;

  for (let i = months - 1; i >= 0; i--) {
    const d = addMonths(now, -i);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const periodRecords = filterByPeriod(records, month, year);

    series.push({
      month,
      year,
      revenue: sumByCategories(periodRecords, REVENUE_CATS),
      expenses: sumByCategories(periodRecords, EXPENSE_CATS),
    });
  }

  return series;
}

export function generate13WeekCashFlow(
  records: FinancialRecord[],
  openingBalance: number,
  companyId: string,
): CashFlowForecast {
  const now = new Date();
  const weeklyActuals: Array<{ cashIn: number; cashOut: number }> = [];

  for (let week = 11; week >= 0; week--) {
    const weekStart = addDays(now, -week * 7 - 7);
    const weekEnd = addDays(now, -week * 7);
    const weekRecords = records.filter((record) => {
      const value = new Date(record.date);
      return value >= weekStart && value < weekEnd;
    });

    weeklyActuals.push({
      cashIn: sumByCategories(weekRecords, REVENUE_CATS),
      cashOut: sumByCategories(weekRecords, EXPENSE_CATS),
    });
  }

  const avgCashIn = ewma(weeklyActuals.map((entry) => entry.cashIn));
  const avgCashOut = ewma(weeklyActuals.map((entry) => entry.cashOut));
  const inSD = stdDev(weeklyActuals.map((entry) => entry.cashIn));
  const outSD = stdDev(weeklyActuals.map((entry) => entry.cashOut));

  let balance = openingBalance;
  const weeks: ForecastPoint[] = [];
  let lowestBalance = balance;
  let lowestBalanceDate = toISO(now);

  for (let week = 0; week < 13; week++) {
    const weekStart = addDays(now, week * 7);
    const seasonalFactor = [0.92, 1.08, 1.0, 0.98, 1.05, 1.02, 0.95, 1.03, 1.0, 0.98, 1.04, 1.01, 0.99][week];
    const projectedCashIn = avgCashIn * seasonalFactor;
    const projectedCashOut = avgCashOut;
    const netCash = projectedCashIn - projectedCashOut;

    balance += netCash;
    if (balance < lowestBalance) {
      lowestBalance = balance;
      lowestBalanceDate = toISO(weekStart);
    }

    weeks.push({
      date: toISO(weekStart),
      predicted: Math.max(0, balance),
      lower: Math.max(0, balance - inSD * 1.28 - outSD * 1.28),
      upper: balance + inSD * 1.28,
      cashIn: Math.round(projectedCashIn),
      cashOut: Math.round(projectedCashOut),
      netCash: Math.round(netCash),
      closingBalance: Math.round(balance),
      status: balance > 0 && netCash >= 0 ? "green" : balance > avgCashOut * 2 ? "amber" : "red",
    });
  }

  const runwayWeeks = avgCashOut > avgCashIn ? Math.max(0, openingBalance / (avgCashOut - avgCashIn) / 7) : Infinity;

  return {
    companyId,
    generatedAt: now.toISOString(),
    openingBalance,
    weeks,
    summary: {
      lowestBalance: Math.round(lowestBalance),
      lowestBalanceDate,
      runwayWeeks: Number.isFinite(runwayWeeks) ? Math.round(runwayWeeks) : 999,
      avgWeeklyCashIn: Math.round(avgCashIn),
      avgWeeklyCashOut: Math.round(avgCashOut),
    },
  };
}

export function generate12MonthForecast(
  records: FinancialRecord[],
  companyId: string,
  monthsAhead = 12,
): RevenueForecast {
  const now = new Date();
  const history = buildMonthlyRevenueSeries(records, 12);
  const revenueHistory = history.map((entry) => entry.revenue);
  const { slope, intercept } = linearRegression(revenueHistory);
  const sd = stdDev(revenueHistory);
  const n = revenueHistory.length;

  const makeScenario = (multiplier: number): ForecastPoint[] =>
    Array.from({ length: monthsAhead }, (_, index) => {
      const predicted = Math.max(0, (intercept + slope * (n + index)) * multiplier);
      return {
        date: toISO(addMonths(now, index + 1)),
        predicted: Math.round(predicted),
        lower: Math.round(Math.max(0, predicted - sd * 1.28)),
        upper: Math.round(predicted + sd * 1.28),
      };
    });

  const base = makeScenario(1);
  const optimistic = makeScenario(1.2);
  const conservative = makeScenario(0.8);
  const annualTarget = base.find((entry) => entry.predicted * 12 >= 1_000_000) ?? base[base.length - 1];
  const projectedARR = (base.at(-1)?.predicted ?? 0) * 12;

  const actuals: ForecastPoint[] = history.slice(-6).map((entry) => ({
    date: `${entry.year}-${String(entry.month).padStart(2, "0")}-01`,
    predicted: entry.revenue,
    lower: entry.revenue,
    upper: entry.revenue,
    isActual: true,
  }));

  return {
    companyId,
    generatedAt: now.toISOString(),
    months: [...actuals, ...base],
    scenarios: { base, optimistic, conservative },
    projectedARR: Math.round(projectedARR),
    projectedARRDate: annualTarget?.date ?? toISO(addMonths(now, monthsAhead)),
  };
}

export interface ForecastAlert {
  type: "negative_balance" | "high_burn" | "declining_revenue" | "low_runway";
  severity: "critical" | "warning" | "info";
  message: string;
  weekOrMonth: string;
}

export function detectForecastAlerts(cf: CashFlowForecast, rf: RevenueForecast): ForecastAlert[] {
  const alerts: ForecastAlert[] = [];
  const negativeWeeks = cf.weeks.filter((week) => (week.closingBalance ?? 0) < 0);

  if (negativeWeeks.length > 0) {
    alerts.push({
      type: "negative_balance",
      severity: "critical",
      message: `Projected negative cash balance starting ${negativeWeeks[0].date}`,
      weekOrMonth: negativeWeeks[0].date,
    });
  }

  const baseTrend = rf.scenarios.base;
  let streak = 0;

  for (let index = 1; index < baseTrend.length; index++) {
    if (baseTrend[index].predicted < baseTrend[index - 1].predicted) {
      streak += 1;
    } else {
      streak = 0;
    }

    if (streak >= 3) {
      alerts.push({
        type: "declining_revenue",
        severity: "warning",
        message: "Revenue forecast declining for 3+ consecutive months",
        weekOrMonth: baseTrend[index].date,
      });
      break;
    }
  }

  if (cf.summary.runwayWeeks < 12 && cf.summary.runwayWeeks < 999) {
    alerts.push({
      type: "low_runway",
      severity: cf.summary.runwayWeeks < 6 ? "critical" : "warning",
      message: `Only ${cf.summary.runwayWeeks} weeks of runway at current burn rate`,
      weekOrMonth: toISO(new Date()),
    });
  }

  return alerts;
}
