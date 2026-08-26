export const INTEGRATION_PROVIDERS = ["xero", "quickbooks", "wave"] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export function isConfigured(provider: IntegrationProvider): boolean {
	if (provider === "xero") return Boolean(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET);
	if (provider === "quickbooks") return Boolean(process.env.QB_CLIENT_ID && process.env.QB_CLIENT_SECRET);
	return false;
}
