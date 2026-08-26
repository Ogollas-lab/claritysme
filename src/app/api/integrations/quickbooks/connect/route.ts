import { NextResponse } from "next/server";
import { requireCompanyContext } from "@/lib/supabase/context";
import { createOAuthState, getRedirectUri } from "@/lib/integrations/oauth";

export async function GET(request: Request) { try { const { company } = await requireCompanyContext(); if (!process.env.QB_CLIENT_ID || !process.env.QB_CLIENT_SECRET) return NextResponse.json({ error: "QuickBooks credentials are not configured" }, { status: 503 }); const params = new URLSearchParams({ client_id: process.env.QB_CLIENT_ID, response_type: "code", scope: "com.intuit.quickbooks.accounting", redirect_uri: getRedirectUri(request, "quickbooks"), state: createOAuthState(company.id, "quickbooks") }); return NextResponse.redirect(`https://appcenter.intuit.com/connect/oauth2?${params}`); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start QuickBooks connection" }, { status: 500 }); } }
