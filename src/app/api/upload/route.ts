import { NextResponse } from "next/server";
import { parseCSV } from "@/lib/csv/parser";
import { calculateKPISnapshot } from "@/lib/calculations/kpi";
import { createClient } from "@/lib/supabase/server";
import { requireCompanyContext } from "@/lib/supabase/context";

export async function POST(request: Request) {
  try {
    const { company } = await requireCompanyContext();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "A CSV file is required" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "CSV files must be smaller than 10 MB" }, { status: 413 });

    const result = parseCSV(await file.text(), company.id, company.currency);
    if (!result.success && result.rowsImported === 0) return NextResponse.json(result, { status: 400 });
    if (result.preview.length === 0) return NextResponse.json({ ...result, error: "No valid transaction rows found" }, { status: 400 });

    const supabase = await createClient();
    const rows = result.preview.map((record) => {
      const { id, created_at, ...insertable } = record;
      void id;
      void created_at;
      return insertable;
    });
    const { error: insertError } = await supabase.from("financial_records").insert(rows);
    if (insertError) throw insertError;

    const { data: allRows, error: recordsError } = await supabase.from("financial_records").select("*").eq("company_id", company.id);
    if (recordsError) throw recordsError;
    const now = new Date();
    const currentRecords = allRows ?? [];
    const snapshot = calculateKPISnapshot(currentRecords, now.getMonth() + 1, now.getFullYear(), company.headcount, 0);
    const { data: savedSnapshot, error: snapshotError } = await supabase.from("kpi_snapshots").upsert({ company_id: company.id, ...snapshot }, { onConflict: "company_id,period_month,period_year" }).select().single();
    if (snapshotError) throw snapshotError;

    return NextResponse.json({ ...result, snapshot: savedSnapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = message.includes("Not authenticated") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
