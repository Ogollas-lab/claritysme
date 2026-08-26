import type { FinancialRecord, KPISnapshot, KPICard, Currency, RecordCategory, Industry } from "@/types";

const REVENUE_CATS: RecordCategory[] = ["revenue_service","revenue_product","revenue_recurring","revenue_one_time","other_income"];
const RECURRING_CATS: RecordCategory[] = ["revenue_recurring"];
const COGS_CATS: RecordCategory[] = ["cogs_labour","cogs_materials","cogs_contractors","cogs_other"];
const PAYROLL_CATS: RecordCategory[] = ["payroll","cogs_labour"];
const OPEX_CATS: RecordCategory[] = ["rent_facilities","software_subscriptions","marketing_advertising","professional_services","utilities","travel_entertainment","depreciation","other_expense"];

export function sumByCategories(records: FinancialRecord[], cats: RecordCategory[]): number {
  return records.filter(r => cats.includes(r.category)).reduce((s, r) => s + r.amount, 0);
}
export function filterByPeriod(records: FinancialRecord[], month: number, year: number): FinancialRecord[] {
  return records.filter(r => r.period_month === month && r.period_year === year);
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function calculateGrossMarginPct(rev: number, cogs: number) { return rev === 0 ? 0 : ((rev - cogs) / rev) * 100; }
export function calculateNetMarginPct(rev: number, net: number)    { return rev === 0 ? 0 : (net / rev) * 100; }
export function calculateBurnRate(rev: number, expenses: number)   { return expenses - rev; }
export function calculateRunwayMonths(cash: number, burn: number): number | null { return burn <= 0 ? null : cash / burn; }
export function calculatePayrollRatioPct(payroll: number, rev: number) { return rev === 0 ? 0 : (payroll / rev) * 100; }
export function calculateMoMGrowthPct(curr: number, prev: number): number | null { return prev === 0 ? null : ((curr - prev) / prev) * 100; }

export function calculateKPISnapshot(
  records: FinancialRecord[], month: number, year: number,
  headcount: number, cashBalance: number, prevRevenue?: number
): Omit<KPISnapshot, "id"|"company_id"|"created_at"> {
  const pr = filterByPeriod(records, month, year);
  const totalRevenue     = sumByCategories(pr, REVENUE_CATS);
  const recurringRevenue = sumByCategories(pr, RECURRING_CATS);
  const totalCogs        = sumByCategories(pr, COGS_CATS);
  const totalPayroll     = sumByCategories(pr, PAYROLL_CATS);
  const totalOpex        = sumByCategories(pr, OPEX_CATS) + sumByCategories(pr, ["payroll"]);
  const grossProfit      = totalRevenue - totalCogs;
  const grossMarginPct   = calculateGrossMarginPct(totalRevenue, totalCogs);
  const ebitda           = totalRevenue - totalCogs - totalOpex;
  const ebitdaMarginPct  = calculateNetMarginPct(totalRevenue, ebitda);
  const burnRate         = calculateBurnRate(totalRevenue, totalCogs + totalOpex);
  const runwayMonths     = calculateRunwayMonths(cashBalance, burnRate);
  const payrollRatioPct  = calculatePayrollRatioPct(totalPayroll, totalRevenue);
  const revenuePerEmp    = headcount > 0 ? totalRevenue / headcount : 0;
  const momGrowth        = prevRevenue !== undefined ? calculateMoMGrowthPct(totalRevenue, prevRevenue) : null;
  const mrr              = recurringRevenue > 0 ? recurringRevenue : null;
  return {
    period_month: month, period_year: year,
    total_revenue: r2(totalRevenue), recurring_revenue: r2(recurringRevenue),
    one_time_revenue: r2(totalRevenue - recurringRevenue),
    total_cogs: r2(totalCogs), total_opex: r2(totalOpex), total_payroll: r2(totalPayroll),
    gross_profit: r2(grossProfit), gross_margin_pct: r2(grossMarginPct),
    ebitda: r2(ebitda), ebitda_margin_pct: r2(ebitdaMarginPct),
    net_profit: r2(ebitda), net_margin_pct: r2(ebitdaMarginPct),
    cash_balance: r2(cashBalance), burn_rate: r2(burnRate),
    runway_months: runwayMonths !== null ? r2(runwayMonths) : null,
    revenue_per_employee: r2(revenuePerEmp), payroll_ratio_pct: r2(payrollRatioPct),
    mom_revenue_growth_pct: momGrowth !== null ? r2(momGrowth) : null,
    arr: mrr ? r2(mrr * 12) : null, mrr,
  };
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD:"$", GBP:"£", KES:"KSh ", NGN:"₦", EUR:"€", SGD:"S$", PHP:"₱"
};

export function formatCurrency(v: number, currency: Currency = "USD"): string {
  const s = CURRENCY_SYMBOLS[currency] ?? "$";
  if (Math.abs(v) >= 1_000_000) return `${s}${(v/1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000)     return `${s}${(v/1_000).toFixed(1)}K`;
  return `${s}${v.toFixed(0)}`;
}
export function formatPct(v: number)   { return `${v.toFixed(1)}%`; }
export function formatMonths(v: number | null): string {
  if (v === null) return "Profitable ∞";
  if (v >= 24) return `${Math.floor(v/12)}y ${Math.floor(v%12)}m`;
  return `${v.toFixed(1)} mo`;
}

export function buildKPICards(snap: KPISnapshot, currency: Currency): KPICard[] {
  const fmt = (v: number) => formatCurrency(v, currency);
  const status = (v: number | null, inv = false): "green"|"amber"|"red"|"neutral" => {
    if (v === null || Math.abs(v) < 0.5) return "neutral";
    return (v > 0) !== inv ? "green" : "red";
  };
  return [
    { label:"Monthly Revenue",   value:snap.total_revenue,        formattedValue:fmt(snap.total_revenue),       change:snap.mom_revenue_growth_pct,  changeLabel:snap.mom_revenue_growth_pct!=null?`${snap.mom_revenue_growth_pct>0?"+":""}${snap.mom_revenue_growth_pct.toFixed(1)}% vs last month`:"No prior data", status:status(snap.mom_revenue_growth_pct), description:"Total revenue this period" },
    { label:"Gross Margin",      value:snap.gross_margin_pct,     formattedValue:formatPct(snap.gross_margin_pct),  change:null, changeLabel:`${fmt(snap.gross_profit)} gross profit`, status:snap.gross_margin_pct>50?"green":snap.gross_margin_pct>35?"amber":"red", description:"(Revenue − COGS) / Revenue", unit:"%" },
    { label:"Burn Rate",         value:snap.burn_rate,            formattedValue:snap.burn_rate<=0?`${fmt(Math.abs(snap.burn_rate))} surplus`:fmt(snap.burn_rate), change:null, changeLabel:snap.burn_rate<=0?"Profitable this month":"Net monthly cash outflow", status:snap.burn_rate<=0?"green":snap.burn_rate<snap.total_revenue*0.2?"amber":"red", description:"Monthly net cash outflow" },
    { label:"Runway",            value:snap.runway_months??Infinity, formattedValue:formatMonths(snap.runway_months), change:null, changeLabel:snap.runway_months!=null?`Until ~${new Date(Date.now()+snap.runway_months*30*86400000).toLocaleDateString("en",{month:"short",year:"numeric"})}`:""  , status:snap.runway_months===null?"green":snap.runway_months>6?"green":snap.runway_months>3?"amber":"red", description:"Cash balance ÷ avg burn", unit:"months" },
    { label:"Payroll Ratio",     value:snap.payroll_ratio_pct,    formattedValue:formatPct(snap.payroll_ratio_pct), change:null, changeLabel:`${fmt(snap.total_payroll)} payroll`, status:snap.payroll_ratio_pct<40?"green":snap.payroll_ratio_pct<55?"amber":"red", description:"Payroll costs as % of revenue", unit:"%" },
    { label:"Revenue / Employee",value:snap.revenue_per_employee, formattedValue:fmt(snap.revenue_per_employee),  change:null, changeLabel:"Per team member / month", status:snap.revenue_per_employee>15000?"green":snap.revenue_per_employee>8000?"amber":"red", description:"Monthly revenue ÷ headcount" },
  ];
}

export const BENCHMARKS: Record<Industry, { grossMarginPct:{p25:number;p50:number;p75:number}; netMarginPct:{p25:number;p50:number;p75:number}; payrollRatioPct:{p25:number;p50:number;p75:number}; revenuePerEmployee:{p25:number;p50:number;p75:number} }> = {
  marketing_agency:     { grossMarginPct:{p25:40,p50:52,p75:62}, netMarginPct:{p25:8,p50:15,p75:22},   payrollRatioPct:{p25:38,p50:48,p75:58}, revenuePerEmployee:{p25:6000,p50:10000,p75:16000} },
  it_msp:               { grossMarginPct:{p25:35,p50:48,p75:60}, netMarginPct:{p25:10,p50:18,p75:25},  payrollRatioPct:{p25:35,p50:45,p75:55}, revenuePerEmployee:{p25:8000,p50:12000,p75:20000} },
  consulting:           { grossMarginPct:{p25:45,p50:60,p75:72}, netMarginPct:{p25:12,p50:22,p75:32},  payrollRatioPct:{p25:30,p50:42,p75:55}, revenuePerEmployee:{p25:7000,p50:13000,p75:22000} },
  saas:                 { grossMarginPct:{p25:60,p50:72,p75:82}, netMarginPct:{p25:-20,p50:5,p75:20},  payrollRatioPct:{p25:40,p50:55,p75:75}, revenuePerEmployee:{p25:12000,p50:20000,p75:35000} },
  accounting:           { grossMarginPct:{p25:42,p50:55,p75:65}, netMarginPct:{p25:10,p50:20,p75:28},  payrollRatioPct:{p25:38,p50:48,p75:60}, revenuePerEmployee:{p25:6500,p50:11000,p75:18000} },
  professional_services:{ grossMarginPct:{p25:40,p50:55,p75:68}, netMarginPct:{p25:10,p50:18,p75:26},  payrollRatioPct:{p25:35,p50:47,p75:58}, revenuePerEmployee:{p25:7000,p50:12000,p75:20000} },
  other:                { grossMarginPct:{p25:35,p50:48,p75:62}, netMarginPct:{p25:5,p50:12,p75:20},   payrollRatioPct:{p25:35,p50:47,p75:60}, revenuePerEmployee:{p25:5000,p50:9000,p75:15000}  },
};

export function getBenchmarkPercentile(value: number, metric: keyof typeof BENCHMARKS.saas, industry: Industry): number {
  const b = BENCHMARKS[industry]?.[metric];
  if (!b) return 50;
  if (value <= b.p25) return Math.round((value/b.p25)*25);
  if (value <= b.p50) return Math.round(25+((value-b.p25)/(b.p50-b.p25))*25);
  if (value <= b.p75) return Math.round(50+((value-b.p50)/(b.p75-b.p50))*25);
  return Math.min(99, Math.round(75+((value-b.p75)/b.p75)*24));
}
