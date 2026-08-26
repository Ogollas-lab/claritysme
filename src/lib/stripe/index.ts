import Stripe from "stripe";
import type { PlanTier } from "@/types";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

	export const PRICE_IDS: Record<PlanTier, { monthly: string | undefined; annual: string | undefined }> = {
		starter: { monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID, annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID },
		growth: { monthly: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID, annual: process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID },
		scale: { monthly: process.env.STRIPE_SCALE_MONTHLY_PRICE_ID, annual: process.env.STRIPE_SCALE_ANNUAL_PRICE_ID },
	};

export const PLAN_PRICES: Record<PlanTier, { monthly: number; annual: number }> = {
	starter: { monthly: 49, annual: Math.round(49 * 12 * 0.8) },
	growth: { monthly: 129, annual: Math.round(129 * 12 * 0.8) },
	scale: { monthly: 299, annual: Math.round(299 * 12 * 0.8) },
};

export function getPlanFromPriceId(priceId: string): PlanTier {
	for (const [plan, ids] of Object.entries(PRICE_IDS)) {
		if (ids.monthly === priceId || ids.annual === priceId) return plan as PlanTier;
	}
	return "starter";
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
	return stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
}

export async function createCheckoutSession(customerId: string, priceId: string, companyId: string, successUrl: string, cancelUrl: string) {
	return stripe.checkout.sessions.create({
		customer: customerId,
		payment_method_types: ["card"],
		line_items: [{ price: priceId, quantity: 1 }],
		mode: "subscription",
		success_url: successUrl,
		cancel_url: cancelUrl,
		metadata: { company_id: companyId },
		subscription_data: { trial_period_days: 14, metadata: { company_id: companyId } },
		allow_promotion_codes: true,
	});
}
