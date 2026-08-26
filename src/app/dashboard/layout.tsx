import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCompanyContext } from "@/lib/supabase/context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getCompanyContext();
  if (!context.userId) redirect("/auth/login");
  if (!context.company) redirect("/onboarding");
  return <DashboardShell companyName={context.company.name}>{children}</DashboardShell>;
}
