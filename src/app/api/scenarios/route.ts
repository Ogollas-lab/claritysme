import { NextResponse } from "next/server";
import { requireCompanyContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { company } = await requireCompanyContext();
    const supabase = await createClient();
    const { data, error } = await supabase.from("scenarios").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ scenarios: data ?? [] });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load scenarios" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const { company } = await requireCompanyContext();
    const body = await request.json() as { name?: unknown; events?: unknown };
    if (typeof body.name !== "string" || !body.name.trim()) return NextResponse.json({ error: "A scenario name is required" }, { status: 400 });
    if (!Array.isArray(body.events)) return NextResponse.json({ error: "Scenario events must be an array" }, { status: 400 });
    const supabase = await createClient();
    const { data, error } = await supabase.from("scenarios").insert({ company_id: company.id, name: body.name.trim(), events: body.events }).select().single();
    if (error) throw error;
    return NextResponse.json({ scenario: data }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save scenario" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const { company } = await requireCompanyContext();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Scenario id is required" }, { status: 400 });
    const supabase = await createClient();
    const { error } = await supabase.from("scenarios").delete().eq("id", id).eq("company_id", company.id);
    if (error) throw error;
    return NextResponse.json({ deleted: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete scenario" }, { status: 500 }); }
}
