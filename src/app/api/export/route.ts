import { NextResponse } from "next/server";
import { requireCompanyContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { exportRecordsToCSV, exportSnapshotsToCSV } from "@/lib/export";
import type { FinancialRecord, KPISnapshot } from "@/types";

export async function GET(request: Request) {
  try {
    const { company } = await requireCompanyContext();
    const type = new URL(request.url).searchParams.get("type") ?? "records";
    const supabase = await createClient();
    if (type === "snapshots") {
      const { data, error } = await supabase.from("kpi_snapshots").select("*").eq("company_id", company.id).order("period_year").order("period_month");
      if (error) throw error;
      return new NextResponse(exportSnapshotsToCSV((data ?? []) as KPISnapshot[], company.currency), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=claritysme-kpis.csv" } });
    }
    const { data, error } = await supabase.from("financial_records").select("*").eq("company_id", company.id).order("date");
    if (error) throw error;
    return new NextResponse(exportRecordsToCSV((data ?? []) as FinancialRecord[], company), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=claritysme-transactions.csv" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to export data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
