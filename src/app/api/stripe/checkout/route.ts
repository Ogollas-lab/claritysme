import { NextResponse } from "next/server";
import { createCheckoutSession, PRICE_IDS } from "@/lib/stripe";
import { requireCompanyContext } from "@/lib/supabase/context";

export async function POST(request: Request) {
	try {
		const { company } = await requireCompanyContext();
		if (!company.stripe_customer_id) return NextResponse.json({ error: "Stripe customer is not configured for this company" }, { status: 409 });
		const body = await request.json() as { plan?: string; interval?: string };
		if (!body.plan || !(body.plan in PRICE_IDS) || !body.interval || !( ["monthly", "annual"] as const).includes(body.interval as "monthly" | "annual")) {
			return NextResponse.json({ error: "Valid plan and interval are required" }, { status: 400 });
		}
		const priceId = PRICE_IDS[body.plan as keyof typeof PRICE_IDS][body.interval as "monthly" | "annual"];
		if (!priceId) return NextResponse.json({ error: "Stripe price is not configured for this plan and interval" }, { status: 503 });
		const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
		const session = await createCheckoutSession(company.stripe_customer_id, priceId, company.id, `${origin}/dashboard/settings?billing=success`, `${origin}/dashboard/settings?billing=canceled`);
		return NextResponse.json({ url: session.url });
	} catch (error) {
		return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create checkout session" }, { status: 500 });
	}
}
