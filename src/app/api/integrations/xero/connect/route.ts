import { NextResponse } from "next/server";
import { requireCompanyContext } from "@/lib/supabase/context";
import { createOAuthState, getRedirectUri } from "@/lib/integrations/oauth";

function isPlaceholder(value: string | undefined): boolean {
	return !value || /your-|example|placeholder|change[-_ ]?me/i.test(value);
}

export async function GET(request: Request) {
	try {
		const { company } = await requireCompanyContext();
		const clientId = process.env.XERO_CLIENT_ID;
		const clientSecret = process.env.XERO_CLIENT_SECRET;
		if (!clientId || !clientSecret || isPlaceholder(clientId) || isPlaceholder(clientSecret)) {
			return NextResponse.json({ error: "Xero credentials are missing or still use placeholder values" }, { status: 503 });
		}

		const params = new URLSearchParams({
			response_type: "code",
			client_id: clientId,
			redirect_uri: getRedirectUri(request, "xero"),
			scope: "openid profile email accounting.transactions offline_access",
			state: createOAuthState(company.id, "xero"),
		});
		return NextResponse.redirect(`https://login.xero.com/identity/connect/authorize?${params}`);
	} catch (error) {
		return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start Xero connection" }, { status: 500 });
	}
}
