import { createHmac, randomBytes } from "node:crypto";

function secret(): string {
  const value = process.env.INTEGRATION_STATE_SECRET ?? process.env.CRON_SECRET;
  if (!value) throw new Error("INTEGRATION_STATE_SECRET is not configured");
  return value;
}

export function createOAuthState(companyId: string, provider: string): string {
  const payload = `${companyId}:${provider}:${Date.now()}:${randomBytes(12).toString("hex")}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyOAuthState(value: string, expectedProvider: string): { companyId: string } {
  const decoded = Buffer.from(value, "base64url").toString("utf8");
  const parts = decoded.split(":");
  if (parts.length !== 5) throw new Error("Invalid OAuth state");
  const [companyId, provider, timestamp, nonce, signature] = parts;
  const payload = `${companyId}:${provider}:${timestamp}:${nonce}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  if (provider !== expectedProvider || signature !== expected || Date.now() - Number(timestamp) > 10 * 60 * 1000) throw new Error("Expired or invalid OAuth state");
  return { companyId };
}

export function getRedirectUri(request: Request, provider: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/api/integrations/${provider}/callback`;
}
