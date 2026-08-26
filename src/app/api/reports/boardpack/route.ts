import { NextResponse } from "next/server";
import { requireCompanyContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { generateBoardpack } from "@/lib/reports/boardpack";
import type { FinancialRecord, KPISnapshot } from "@/types";

export async function GET() {
  try {
    const { company } = await requireCompanyContext();
    const supabase = await createClient();
    const [{ data: records, error: recordsError }, { data: snapshot, error: snapshotError }] = await Promise.all([
      supabase.from("financial_records").select("*").eq("company_id", company.id),
      supabase.from("kpi_snapshots").select("*").eq("company_id", company.id).order("period_year", { ascending: false }).order("period_month", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (recordsError) throw recordsError;
    if (snapshotError) throw snapshotError;
    if (!snapshot) return NextResponse.json({ error: "Upload transactions before generating a boardpack" }, { status: 404 });
    const period = `${snapshot.period_year}-${String(snapshot.period_month).padStart(2, "0")}`;
    const report = generateBoardpack(company, (records ?? []) as FinancialRecord[], snapshot as KPISnapshot, period);
    const { data: savedReport, error: reportError } = await supabase
      .from("reports")
      .insert({
        company_id: company.id,
        type: "boardpack",
        period_month: snapshot.period_month,
        period_year: snapshot.period_year,
        payload: report,
      })
      .select("id")
      .single();
    if (reportError) throw reportError;
    return NextResponse.json({ ...report, reportId: savedReport.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate boardpack" }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
