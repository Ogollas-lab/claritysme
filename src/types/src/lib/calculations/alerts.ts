import type { KPISnapshot, Alert, Company } from "@/types";
import { BENCHMARKS } from "@/lib/calculations/kpi";

export function generateAlerts(snap: KPISnapshot, company: Company): Alert[] {
  const alerts: Alert[] = [];
  const bench = BENCHMARKS[company.industry];
  const now = new Date().toISOString();

  if (snap.runway_months !== null) {
    if (snap.runway_months < 1.5) alerts.push({ id:"runway_critical", type:"runway", severity:"critical", message:`CRITICAL: Only ${snap.runway_months.toFixed(1)} months of runway remaining. Immediate action required.`, value:snap.runway_months, threshold:1.5, triggeredAt:now, isRead:false });
    else if (snap.runway_months < 3) alerts.push({ id:"runway_warning", type:"runway", severity:"warning", message:`Runway is ${snap.runway_months.toFixed(1)} months. Review cash flow and plan fundraising or cost reduction.`, value:snap.runway_months, threshold:3, triggeredAt:now, isRead:false });
    else if (snap.runway_months < 6) alerts.push({ id:"runway_info", type:"runway", severity:"info", message:`Runway is ${snap.runway_months.toFixed(1)} months. Consider proactive measures to extend beyond 6 months.`, value:snap.runway_months, threshold:6, triggeredAt:now, isRead:false });
  }

  const marginGap = bench.grossMarginPct.p50 - snap.gross_margin_pct;
  if (marginGap > 10) alerts.push({ id:"margin_critical", type:"margin", severity:"critical", message:`Gross margin (${snap.gross_margin_pct.toFixed(1)}%) is ${marginGap.toFixed(0)}pts below the ${company.industry.replace(/_/g," ")} median (${bench.grossMarginPct.p50}%). Review pricing and direct costs.`, value:snap.gross_margin_pct, threshold:bench.grossMarginPct.p50, triggeredAt:now, isRead:false });
  else if (marginGap > 5) alerts.push({ id:"margin_warning", type:"margin", severity:"warning", message:`Gross margin (${snap.gross_margin_pct.toFixed(1)}%) is below the peer median of ${bench.grossMarginPct.p50}%. Consider a pricing review.`, value:snap.gross_margin_pct, threshold:bench.grossMarginPct.p50, triggeredAt:now, isRead:false });

  if (snap.payroll_ratio_pct > 60) alerts.push({ id:"payroll_critical", type:"payroll", severity:"critical", message:`Payroll ratio is ${snap.payroll_ratio_pct.toFixed(1)}% of revenue — significantly above the safe threshold of 55%.`, value:snap.payroll_ratio_pct, threshold:60, triggeredAt:now, isRead:false });
  else if (snap.payroll_ratio_pct > 50) alerts.push({ id:"payroll_warning", type:"payroll", severity:"warning", message:`Payroll ratio (${snap.payroll_ratio_pct.toFixed(1)}%) is approaching the 55% warning level.`, value:snap.payroll_ratio_pct, threshold:50, triggeredAt:now, isRead:false });

  if (snap.mom_revenue_growth_pct !== null && snap.mom_revenue_growth_pct < -5) alerts.push({ id:"revenue_decline", type:"revenue_decline", severity:"warning", message:`Revenue declined ${Math.abs(snap.mom_revenue_growth_pct).toFixed(1)}% month-over-month. Investigate client churn or project pipeline gaps.`, value:snap.mom_revenue_growth_pct, threshold:-5, triggeredAt:now, isRead:false });

  if (snap.total_revenue === 0) alerts.push({ id:"no_revenue", type:"revenue_decline", severity:"critical", message:"No revenue recorded this period. Check if data upload is missing.", value:0, threshold:1, triggeredAt:now, isRead:false });

  return alerts;
}