import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!secret) {
    return Response.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  try {
    const payload = await request.text();
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return Response.json({ received: true, type: event.type });
  } catch {
    return Response.json({ error: "Invalid Stripe webhook signature or payload" }, { status: 400 });
  }
}
