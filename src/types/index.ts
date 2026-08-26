export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Industry = "marketing_agency"|"it_msp"|"consulting"|"saas"|"accounting"|"professional_services"|"other";
export type Currency = "USD"|"GBP"|"KES"|"NGN"|"EUR"|"SGD"|"PHP";
export type RevenueModel = "retainer"|"subscription"|"project"|"mixed";
export type PlanTier = "starter"|"growth"|"scale";
export type RecordType = "income"|"expense"|"asset"|"liability";
export type RecordCategory =
  "revenue_service"|"revenue_product"|"revenue_recurring"|"revenue_one_time"|"other_income"|
  "cogs_labour"|"cogs_materials"|"cogs_contractors"|"cogs_other"|
  "payroll"|"rent_facilities"|"software_subscriptions"|"marketing_advertising"|
  "professional_services"|"utilities"|"travel_entertainment"|"depreciation"|
  "interest_expense"|"tax"|"other_expense"|
  "cash_equivalents"|"accounts_receivable"|"fixed_assets"|"accounts_payable"|
  "short_term_debt"|"long_term_debt";

export interface Company {
  id: string; owner_id: string; name: string; industry: Industry;
  country: string; currency: Currency; revenue_band: string;
  revenue_model: RevenueModel; headcount: number;
  fiscal_year_start_month: number; created_at: string; updated_at: string;
  onboarding_completed: boolean; logo_url: string | null;
  stripe_customer_id: string | null;
}

export interface Profile {
  id: string; email: string; full_name: string | null;
  avatar_url: string | null; company_id: string | null;
  created_at: string; updated_at: string;
}

export interface FinancialRecord {
  id: string; company_id: string; date: string;
  period_month: number; period_year: number;
  type: RecordType; category: RecordCategory;
  description: string; amount: number; currency: Currency;
  source: "csv_upload"|"manual"|"quickbooks"|"xero"|"wave";
  created_at: string;
}

export interface KPISnapshot {
  id: string; company_id: string; period_month: number; period_year: number;
  total_revenue: number; recurring_revenue: number; one_time_revenue: number;
  total_cogs: number; total_opex: number; total_payroll: number;
  gross_profit: number; gross_margin_pct: number;
  ebitda: number; ebitda_margin_pct: number;
  net_profit: number; net_margin_pct: number;
  cash_balance: number; burn_rate: number; runway_months: number | null;
  revenue_per_employee: number; payroll_ratio_pct: number;
  mom_revenue_growth_pct: number | null; arr: number | null; mrr: number | null;
  created_at: string;
}

export interface KPICard {
  label: string; value: number | string; formattedValue: string;
  change: number | null; changeLabel: string;
  status: "green"|"amber"|"red"|"neutral"; description: string; unit?: string;
}

export interface ForecastPoint {
  date: string; predicted: number; lower: number; upper: number;
  isActual?: boolean; cashIn?: number; cashOut?: number;
  netCash?: number; closingBalance?: number; status?: "green"|"amber"|"red";
}

export interface CashFlowForecast {
  companyId: string; generatedAt: string; openingBalance: number;
  weeks: ForecastPoint[];
  summary: {
    lowestBalance: number; lowestBalanceDate: string;
    runwayWeeks: number; avgWeeklyCashIn: number; avgWeeklyCashOut: number;
  };
}

export interface RevenueForecast {
  companyId: string; generatedAt: string; months: ForecastPoint[];
  scenarios: { base: ForecastPoint[]; optimistic: ForecastPoint[]; conservative: ForecastPoint[]; };
  projectedARR: number; projectedARRDate: string;
}

export type ScenarioEventType = "add_employee"|"add_revenue"|"remove_revenue"|"one_time_expense"|"one_time_revenue";
export interface ScenarioEvent {
  id: string; type: ScenarioEventType; label: string;
  startDate: string; endDate?: string; monthlyImpact: number;
}
export interface Scenario {
  id: string; name: string; companyId: string;
  events: ScenarioEvent[]; createdAt: string;
}

export type InsightType = "health_summary"|"cash_flow_alert"|"benchmark_comparison"|"growth_opportunity"|"cost_reduction"|"forecast_narrative";
export interface AIInsight {
  id: string; company_id: string; type: InsightType;
  title: string; body: string;
  priority: "critical"|"warning"|"info"|"positive";
  period_month: number | null; period_year: number | null;
  created_at: string; is_read: boolean;
}

export interface Subscription {
  id: string; company_id: string; stripe_subscription_id: string;
  stripe_price_id: string; plan: PlanTier;
  status: "active"|"trialing"|"past_due"|"canceled"|"incomplete";
  current_period_start: string; current_period_end: string;
  cancel_at_period_end: boolean; created_at: string; updated_at: string;
}

export const PLAN_LIMITS: Record<PlanTier, {
  dashboards: number; reports: number; users: number;
  dataHistoryMonths: number; apiAccess: boolean; aiInsights: boolean;
  benchmarking: "industry"|"peer"|"custom";
}> = {
  starter:  { dashboards:3,        reports:5,        users:1,        dataHistoryMonths:12,       apiAccess:false, aiInsights:false, benchmarking:"industry" },
  growth:   { dashboards:10,       reports:20,       users:5,        dataHistoryMonths:36,       apiAccess:false, aiInsights:true,  benchmarking:"peer"     },
  scale:    { dashboards:Infinity, reports:Infinity, users:Infinity, dataHistoryMonths:Infinity, apiAccess:true,  aiInsights:true,  benchmarking:"custom"   },
};

export interface CSVRow { date: string; description: string; amount: string|number; category?: string; type?: string; }
export interface CSVUploadResult {
  success: boolean; rowsProcessed: number; rowsImported: number;
  errors: Array<{row: number; message: string}>; preview: FinancialRecord[];
}
export interface Alert {
  id: string; type: "runway"|"margin"|"payroll"|"revenue_decline"|"cash_balance";
  severity: "critical"|"warning"|"info"; message: string;
  value: number; threshold: number; triggeredAt: string; isRead: boolean;
}