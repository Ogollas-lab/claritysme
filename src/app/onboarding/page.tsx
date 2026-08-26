"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", industry: "marketing_agency", country: "", currency: "USD", revenue_model: "mixed", headcount: "1" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(name: string, value: string) { setForm((current) => ({ ...current, [name]: value })); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session has expired. Please sign in again.");
      const { data: company, error: companyError } = await supabase.from("companies").insert({
        owner_id: user.id, name: form.name.trim(), industry: form.industry, country: form.country.trim(), currency: form.currency,
        revenue_model: form.revenue_model, headcount: Number(form.headcount), onboarding_completed: true,
      }).select().single();
      if (companyError) throw companyError;
      const { error: profileError } = await supabase.from("profiles").update({ company_id: company.id }).eq("id", user.id);
      if (profileError) throw profileError;
      router.replace("/dashboard/overview");
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save your company.");
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] px-6 py-12 text-[#f8f8fc]">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-2xl font-bold gradient-text" style={{ fontFamily: "Syne,sans-serif" }}>ClaritySME</Link>
        <section className="glass-card mt-10 p-8">
          <p className="label-sm">Workspace setup</p>
          <h1 className="mt-2 text-3xl font-bold">Tell us about your business</h1>
          <p className="mt-2 text-[#8888a4]">This information powers your benchmarks and financial calculations.</p>
          <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="text-sm text-[#c4c4d4] sm:col-span-2">Business name<input className="input-field mt-2" required value={form.name} onChange={(e) => update("name", e.target.value)} /></label>
            <label className="text-sm text-[#c4c4d4]">Industry<select className="select-field mt-2" value={form.industry} onChange={(e) => update("industry", e.target.value)}>{[["marketing_agency","Marketing agency"],["it_msp","IT MSP"],["consulting","Consulting"],["saas","SaaS"],["accounting","Accounting"],["professional_services","Professional services"],["other","Other"]].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-sm text-[#c4c4d4]">Country<input className="input-field mt-2" required value={form.country} onChange={(e) => update("country", e.target.value)} /></label>
            <label className="text-sm text-[#c4c4d4]">Currency<select className="select-field mt-2" value={form.currency} onChange={(e) => update("currency", e.target.value)}>{["USD","GBP","KES","NGN","EUR","SGD","PHP"].map((currency) => <option key={currency}>{currency}</option>)}</select></label>
            <label className="text-sm text-[#c4c4d4]">Revenue model<select className="select-field mt-2" value={form.revenue_model} onChange={(e) => update("revenue_model", e.target.value)}>{[["retainer","Retainer"],["subscription","Subscription"],["project","Project"],["mixed","Mixed"]].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-sm text-[#c4c4d4]">Team size<input className="input-field mt-2" type="number" min="0" required value={form.headcount} onChange={(e) => update("headcount", e.target.value)} /></label>
            {error && <p role="alert" className="text-sm text-rose-300 sm:col-span-2">{error}</p>}
            <button className="btn-primary justify-center py-3 sm:col-span-2" type="submit" disabled={saving}>{saving ? "Saving workspace..." : "Continue to dashboard"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
