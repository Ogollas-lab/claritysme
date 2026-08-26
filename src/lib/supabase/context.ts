import type { Company, Profile } from "@/types";
import { createClient } from "./server";

export interface CompanyContext {
  userId: string;
  profile: Profile | null;
  company: Company | null;
}

export async function getCompanyContext(): Promise<CompanyContext> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return { userId: "", profile: null, company: null };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;

  let company: Company | null = null;
  if (profile?.company_id) {
    const { data, error } = await supabase.from("companies").select("*").eq("id", profile.company_id).maybeSingle();
    if (error) throw error;
    company = data as Company | null;
  }

  return { userId: user.id, profile: profile as Profile | null, company };
}

export async function requireCompanyContext(): Promise<CompanyContext & { company: Company }> {
  const context = await getCompanyContext();
  if (!context.userId) throw new Error("Not authenticated");
  if (!context.company) throw new Error("Company onboarding is incomplete");
  return context as CompanyContext & { company: Company };
}
