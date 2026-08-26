import { NextResponse } from "next/server";
import { createCustomerPortalSession } from "@/lib/stripe";
import { requireCompanyContext } from "@/lib/supabase/context";

export async function POST(request: Request) { try { const {company}=await requireCompanyContext(); if(!company.stripe_customer_id)return NextResponse.json({error:"Stripe customer is not configured for this company"},{status:409}); const origin=process.env.NEXT_PUBLIC_APP_URL??new URL(request.url).origin; const session=await createCustomerPortalSession(company.stripe_customer_id,`${origin}/dashboard/settings`); return NextResponse.json({url:session.url}); } catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to create billing portal session"},{status:500});} }
