import { requireCompanyContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatPct } from "@/lib/calculations/kpi";
import { DataNotice } from "@/components/dashboard/DataNotice";

export default async function KPIsPage() {
  const { company } = await requireCompanyContext(); const supabase = await createClient();
  const { data } = await supabase.from("kpi_snapshots").select("*").eq("company_id", company.id).order("period_year", { ascending: false }).order("period_month", { ascending: false }).limit(12);
  const snapshots = data ?? [];
  return <div className="mx-auto max-w-7xl px-6 py-8"><p className="label-sm">Performance</p><h1 className="mt-2 text-3xl font-bold">KPI history</h1><p className="mt-2 text-[#8888a4]">Track the metrics that drive your operating decisions.</p>{snapshots.length === 0 ? <DataNotice /> : <div className="mt-8 overflow-x-auto glass-card"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-white/10 text-[#8888a4]"><tr>{["Period","Revenue","Gross margin","EBITDA","Cash","Runway"].map((head) => <th key={head} className="px-5 py-4 font-medium">{head}</th>)}</tr></thead><tbody>{snapshots.map((snapshot) => <tr key={snapshot.id} className="border-b border-white/5"><td className="px-5 py-4">{snapshot.period_year}-{String(snapshot.period_month).padStart(2,"0")}</td><td className="px-5 py-4">{formatCurrency(snapshot.total_revenue, company.currency)}</td><td className="px-5 py-4">{formatPct(snapshot.gross_margin_pct)}</td><td className="px-5 py-4">{formatCurrency(snapshot.ebitda, company.currency)}</td><td className="px-5 py-4">{formatCurrency(snapshot.cash_balance, company.currency)}</td><td className="px-5 py-4">{snapshot.runway_months === null ? "Profitable" : `${snapshot.runway_months.toFixed(1)} mo`}</td></tr>)}</tbody></table></div>}</div>;
}
