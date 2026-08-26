import { NextResponse } from "next/server";
import { generateAllInsights } from "@/lib/ai/insights";
import { requireCompanyContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import type { Company, KPISnapshot } from "@/types";

export async function POST() { try { if(!process.env.ANTHROPIC_API_KEY||process.env.ANTHROPIC_API_KEY.includes("your-")) return NextResponse.json({error:"AI insights are not configured"},{status:503}); const {company}=await requireCompanyContext(); const supabase=await createClient(); const {data}=await supabase.from("kpi_snapshots").select("*").eq("company_id",company.id).order("period_year",{ascending:false}).order("period_month",{ascending:false}).limit(2); if(!data?.length) return NextResponse.json({error:"Upload transactions before generating insights"},{status:404}); const insights=await generateAllInsights(company as Company,data[0] as KPISnapshot,data[1] as KPISnapshot|undefined); const rows=insights.map((insight)=>({company_id:company.id,...insight})); const {data:saved,error}=await supabase.from("ai_insights").insert(rows).select(); if(error)throw error; return NextResponse.json({insights:saved}); } catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to generate insights"},{status:500});} }

export async function GET() { return POST(); }
