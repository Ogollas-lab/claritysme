import Anthropic from "@anthropic-ai/sdk";
import type { KPISnapshot, Company, AIInsight, InsightType } from "@/types";
import { BENCHMARKS, formatCurrency, formatPct, formatMonths } from "@/lib/calculations/kpi";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(company: Company, s: KPISnapshot, ps: KPISnapshot | undefined, type: InsightType, cashRunwayWeeks?: number): string {
  const bench = BENCHMARKS[company.industry];
  const cur = company.currency;
  const context = `
COMPANY: ${company.name}
Industry: ${company.industry.replace(/_/g," ")} | Country: ${company.country} | Headcount: ${company.headcount}
Period: ${s.period_month}/${s.period_year}

FINANCIALS:
- Revenue: ${formatCurrency(s.total_revenue,cur)} (MoM: ${s.mom_revenue_growth_pct!=null?`${s.mom_revenue_growth_pct>0?"+":""}${s.mom_revenue_growth_pct.toFixed(1)}%`:"N/A"})
- Gross Margin: ${formatPct(s.gross_margin_pct)} (peer median: ${bench.grossMarginPct.p50}%)
- Net Margin: ${formatPct(s.net_margin_pct)} (peer median: ${bench.netMarginPct.p50}%)
- Payroll Ratio: ${formatPct(s.payroll_ratio_pct)} (peer median: ${bench.payrollRatioPct.p50}%)
- Burn Rate: ${formatCurrency(s.burn_rate,cur)}/mo
- Runway: ${formatMonths(s.runway_months)}
- Cash Balance: ${formatCurrency(s.cash_balance,cur)}
- MRR/ARR: ${s.mrr?formatCurrency(s.mrr,cur)+" / "+formatCurrency(s.arr??0,cur):"N/A"}
${cashRunwayWeeks!==undefined?`- Cash Runway (weeks): ${cashRunwayWeeks}`:""}
${ps?`\nPRIOR PERIOD: Revenue ${formatCurrency(ps.total_revenue,cur)}, Gross Margin ${formatPct(ps.gross_margin_pct)}`:""}`.trim();

  const prompts: Record<InsightType, string> = {
    health_summary: `${context}\n\nWrite a concise 3-4 sentence financial health summary. Cover: overall health, best metric, biggest risk, one actionable recommendation. Be specific with numbers.`,
    cash_flow_alert: `${context}\n\nWrite a 2-3 sentence cash flow alert. Runway is ${formatMonths(s.runway_months)}. Be specific about risk level, timeline, and what action to take this week.`,
    benchmark_comparison: `${context}\n\nWrite a 3-sentence benchmark analysis vs peers. Cover: which metrics are above/below median, what it means operationally, one concrete improvement action.`,
    growth_opportunity: `${context}\n\nIdentify the single biggest growth opportunity from the data. Write 2-3 sentences: what it is, why the data supports it, first step to pursue it.`,
    cost_reduction: `${context}\n\nIdentify the most impactful cost reduction opportunity. Write 2-3 sentences: which cost line is the issue, how it compares to industry, specific action to address it.`,
    forecast_narrative: `${context}\n\nWrite a 3-sentence forward-looking narrative covering: revenue trajectory, cash position outlook, and the key assumption that will determine success next quarter.`,
  };
  return prompts[type];
}

export async function generateInsight(company: Company, currentSnapshot: KPISnapshot, previousSnapshot?: KPISnapshot, cashRunwayWeeks?: number, type: InsightType = "health_summary"): Promise<Omit<AIInsight,"id"|"company_id"|"created_at"|"is_read">> {
  const PRIORITY_MAP: Record<InsightType, AIInsight["priority"]> = {
    health_summary: "info", cash_flow_alert: currentSnapshot.runway_months!==null&&currentSnapshot.runway_months<3?"critical":"warning",
    benchmark_comparison: "info", growth_opportunity: "positive", cost_reduction: "warning", forecast_narrative: "info",
  };
  const TITLE_MAP: Record<InsightType, string> = {
    health_summary: "Monthly Financial Health Summary", cash_flow_alert: "Cash Flow Alert",
    benchmark_comparison: "Industry Benchmark Report", growth_opportunity: "Growth Opportunity Identified",
    cost_reduction: "Cost Reduction Opportunity", forecast_narrative: "Quarterly Outlook",
  };

  const message = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 400,
    system: "You are a concise, data-driven CFO advisor for SMEs. Be specific, avoid generic advice, always reference actual numbers. Write in clear direct prose, no bullet points.",
    messages: [{ role: "user", content: buildPrompt(company, currentSnapshot, previousSnapshot, type, cashRunwayWeeks) }],
  });

  const body = message.content.filter((block): block is Anthropic.TextBlock => block.type === "text").map((block) => block.text).join("\n").trim();
  return { type, title: TITLE_MAP[type], body, priority: PRIORITY_MAP[type], period_month: currentSnapshot.period_month, period_year: currentSnapshot.period_year };
}

export async function generateAllInsights(company: Company, currentSnapshot: KPISnapshot, previousSnapshot?: KPISnapshot, cashRunwayWeeks?: number): Promise<Array<Omit<AIInsight,"id"|"company_id"|"created_at"|"is_read">>> {
  const types: InsightType[] = ["health_summary","benchmark_comparison"];
  if (currentSnapshot.runway_months!==null && currentSnapshot.runway_months<6) types.push("cash_flow_alert");
  if (currentSnapshot.gross_margin_pct < BENCHMARKS[company.industry].grossMarginPct.p50) types.push("cost_reduction");
  if ((currentSnapshot.mom_revenue_growth_pct??0) > 5) types.push("growth_opportunity");

  const results = await Promise.allSettled(types.map(type => generateInsight(company, currentSnapshot, previousSnapshot, cashRunwayWeeks, type)));
  return results.filter((r): r is PromiseFulfilledResult<Omit<AIInsight,"id"|"company_id"|"created_at"|"is_read">> => r.status==="fulfilled").map(r => r.value);
}
