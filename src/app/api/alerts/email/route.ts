import { NextResponse } from "next/server";
import { requireCompanyContext } from "@/lib/supabase/context";

export async function POST(request: Request) {
  try {
    await requireCompanyContext();
    const apiKey = process.env.SENDGRID_API_KEY;
    const from = process.env.SENDGRID_FROM_EMAIL;
    if (!apiKey || !from) return NextResponse.json({ error: "SendGrid credentials and SENDGRID_FROM_EMAIL are required" }, { status: 503 });
    const body = await request.json() as { to?: unknown; subject?: unknown; text?: unknown; html?: unknown };
    if (typeof body.to !== "string" || typeof body.subject !== "string" || typeof body.text !== "string") return NextResponse.json({ error: "to, subject, and text are required" }, { status: 400 });
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ personalizations: [{ to: [{ email: body.to }] }], from: { email: from }, subject: body.subject, content: [{ type: "text/plain", value: body.text }, ...(typeof body.html === "string" ? [{ type: "text/html", value: body.html }] : [])] }) });
    if (!response.ok) return NextResponse.json({ error: `SendGrid rejected the message (${response.status})` }, { status: 502 });
    return NextResponse.json({ sent: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send alert email" }, { status: 500 }); }
}
