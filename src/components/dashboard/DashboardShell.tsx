"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  ["/dashboard/overview", "Overview"],
  ["/dashboard/kpis", "KPIs"],
  ["/dashboard/cashflow", "Cash flow"],
  ["/dashboard/forecasting", "Forecasting"],
  ["/dashboard/trends", "Trends"],
  ["/dashboard/alerts", "Alerts"],
  ["/dashboard/insights", "Insights"],
  ["/dashboard/chat", "AI chat"],
  ["/dashboard/scenarios", "Scenarios"],
  ["/dashboard/reports", "Reports"],
  ["/dashboard/upload", "Upload"],
  ["/dashboard/integrations", "Integrations"],
  ["/dashboard/settings", "Settings"],
] as const;

export function DashboardShell({ children, companyName }: { children: React.ReactNode; companyName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f8f8fc] lg:flex">
      <aside className="border-b border-white/10 bg-[#11111a] lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link href="/dashboard/overview" className="text-xl font-bold gradient-text" style={{ fontFamily: "Syne,sans-serif" }}>ClaritySME</Link>
          <span className="hidden truncate text-xs text-[#8888a4] lg:mt-2 lg:block">{companyName || "Financial workspace"}</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:px-3">
          {NAV_ITEMS.map(([href, label]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} className={`sidebar-link whitespace-nowrap ${active ? "active" : ""}`}>{label}</Link>;
          })}
        </nav>
        <button type="button" onClick={signOut} disabled={signingOut} className="btn-ghost mx-3 mb-4 w-[calc(100%-1.5rem)] justify-center text-sm lg:mt-5">{signingOut ? "Signing out..." : "Sign out"}</button>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
