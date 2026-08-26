import Link from "next/link";
import { requireCompanyContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatMonths, formatPct } from "@/lib/calculations/kpi";

export default async function OverviewPage() {
  const { company } = await requireCompanyContext();
  const supabase = await createClient();
  const { data: snapshot } = await supabase.from("kpi_snapshots").select("*").eq("company_id", company.id).order("period_year", { ascending: false }).order("period_month", { ascending: false }).limit(1).maybeSingle();
  const latest = snapshot as { total_revenue: number; gross_margin_pct: number; burn_rate: number; runway_months: number | null; cash_balance: number; mom_revenue_growth_pct: number | null } | null;
  const cards = latest ? [
    ["Monthly revenue", formatCurrency(latest.total_revenue, company.currency)],
    ["Gross margin", formatPct(latest.gross_margin_pct)],
    ["Burn rate", latest.burn_rate <= 0 ? `${formatCurrency(Math.abs(latest.burn_rate), company.currency)} surplus` : formatCurrency(latest.burn_rate, company.currency)],
    ["Runway", formatMonths(latest.runway_months)],
  ] : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="label-sm">Executive overview</p><h1 className="mt-2 text-3xl font-bold">Good morning, {company.name}</h1><p className="mt-2 text-[#8888a4]">Your latest financial position at a glance.</p></div>
        <Link href="/dashboard/upload" className="btn-primary justify-center">Upload transactions</Link>
      </div>
      {latest ? <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value]) => <div key={label} className="kpi-card"><p className="label-sm">{label}</p><p className="mt-3 text-2xl font-bold">{value}</p></div>)}</div> : <section className="glass-card mt-8 p-8"><h2 className="text-xl font-bold">Your dashboard is ready for data</h2><p className="mt-2 max-w-xl text-[#8888a4]">Upload a CSV of transactions to calculate your first KPI snapshot, forecast, and alerts.</p><Link href="/dashboard/upload" className="btn-primary mt-6">Upload your first CSV</Link></section>}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6"><h2 className="section-title">Cash position</h2><p className="mt-4 text-3xl font-bold">{latest ? formatCurrency(latest.cash_balance, company.currency) : "No snapshot yet"}</p><p className="mt-2 text-sm text-[#8888a4]">Current cash balance from your latest KPI snapshot.</p></div>
        <div className="glass-card p-6"><h2 className="section-title">Revenue momentum</h2><p className="mt-4 text-3xl font-bold">{latest?.mom_revenue_growth_pct !== null && latest?.mom_revenue_growth_pct !== undefined ? `${latest.mom_revenue_growth_pct > 0 ? "+" : ""}${latest.mom_revenue_growth_pct.toFixed(1)}%` : "No prior period"}</p><p className="mt-2 text-sm text-[#8888a4]">Month-over-month change from your latest available periods.</p></div>
      </section>
    </div>
  );
}
