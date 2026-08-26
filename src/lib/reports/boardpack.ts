import type { FinancialRecord, KPISnapshot, Company } from "@/types";

export interface BoardpackSection {
  title: string;
  summary: string;
  metrics: Array<{ label: string; value: string; direction?: "up" | "down" | "neutral" }>;
}

export interface BoardpackReport {
  companyName: string;
  period: string;
  sections: BoardpackSection[];
  highlights: string[];
}

export function generateBoardpack(
  company: Company,
  records: FinancialRecord[],
  snapshot: KPISnapshot,
  monthLabel = "This month",
): BoardpackReport {
  const revenue = snapshot.total_revenue;
  const grossMargin = snapshot.gross_margin_pct;
  const burn = snapshot.burn_rate;
  const runway = snapshot.runway_months ?? 0;

  const sections: BoardpackSection[] = [
    {
      title: "Revenue",
      summary: `Revenue reached ${revenue.toLocaleString()} for the period with recurring revenue contributing ${snapshot.recurring_revenue.toLocaleString()}.`,
      metrics: [
        { label: "Total revenue", value: `$${revenue.toLocaleString()}` },
        { label: "Recurring revenue", value: `$${snapshot.recurring_revenue.toLocaleString()}` },
        { label: "Monthly growth", value: `${snapshot.mom_revenue_growth_pct ?? 0}%`, direction: (snapshot.mom_revenue_growth_pct ?? 0) >= 0 ? "up" : "down" },
      ],
    },
    {
      title: "Margin",
      summary: `Gross margin remained at ${grossMargin.toFixed(1)}% with operating leverage improving as the business scales.`,
      metrics: [
        { label: "Gross margin", value: `${grossMargin.toFixed(1)}%` },
        { label: "EBITDA", value: `$${snapshot.ebitda.toLocaleString()}` },
        { label: "Payroll ratio", value: `${snapshot.payroll_ratio_pct.toFixed(1)}%` },
      ],
    },
    {
      title: "Cash",
      summary: `Cash balance stands at ${snapshot.cash_balance.toLocaleString()} with runway of ${runway.toFixed(1)} months.`,
      metrics: [
        { label: "Cash balance", value: `$${snapshot.cash_balance.toLocaleString()}` },
        { label: "Burn rate", value: `$${burn.toLocaleString()}` },
        { label: "Runway", value: `${runway.toFixed(1)} mo` },
      ],
    },
  ];

  const highlights = [
    `${company.name} is tracking ${grossMargin.toFixed(1)}% gross margin in ${monthLabel.toLowerCase()}.`,
    `Net profit was ${snapshot.net_profit.toLocaleString()} with ${snapshot.total_payroll.toLocaleString()} in payroll costs.`,
    runway > 6 ? "The company remains comfortably above the 6-month runway target." : "Runway is tightening and should be reviewed with the board.",
  ];

  return {
    companyName: company.name,
    period: monthLabel,
    sections,
    highlights,
  };
}
