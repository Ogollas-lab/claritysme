"use client";

import { useEffect, useState } from "react";

type Scenario = { id: string; name: string; events: Array<{ type: string; label: string; monthlyImpact: number }> };

export default function ScenariosPage() {
  const [name, setName] = useState("New scenario");
  const [revenue, setRevenue] = useState(0);
  const [expense, setExpense] = useState(0);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const netImpact = revenue - expense;

  async function load() { const response = await fetch("/api/scenarios"); const body = await response.json(); if (response.ok) setScenarios(body.scenarios); else setError(body.error); }
  useEffect(() => { void load(); }, []);
  async function save() { setError(""); setMessage(""); const response = await fetch("/api/scenarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, events: [{ type: "add_revenue", label: "Revenue adjustment", monthlyImpact: revenue }, { type: "one_time_expense", label: "Expense adjustment", monthlyImpact: -expense }] }) }); const body = await response.json(); if (!response.ok) setError(body.error); else { setMessage("Scenario saved."); await load(); } }
  async function remove(id: string) { await fetch(`/api/scenarios?id=${encodeURIComponent(id)}`, { method: "DELETE" }); await load(); }

  return <div className="mx-auto max-w-4xl px-6 py-8"><p className="label-sm">Planning</p><h1 className="mt-2 text-3xl font-bold">Scenario planner</h1><p className="mt-2 text-[#8888a4]">Model and save monthly changes before committing to them.</p><section className="glass-card mt-8 grid gap-5 p-6 sm:grid-cols-2"><label className="text-sm text-[#c4c4d4] sm:col-span-2">Scenario name<input className="input-field mt-2" value={name} onChange={(event) => setName(event.target.value)} /></label><label className="text-sm text-[#c4c4d4]">Monthly revenue change<input className="input-field mt-2" type="number" value={revenue} onChange={(event) => setRevenue(Number(event.target.value))} /></label><label className="text-sm text-[#c4c4d4]">Monthly expense change<input className="input-field mt-2" type="number" value={expense} onChange={(event) => setExpense(Number(event.target.value))} /></label><div className="sm:col-span-2"><p className="label-sm">Monthly net impact</p><p className={`mt-3 text-3xl font-bold ${netImpact >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{netImpact >= 0 ? "+" : ""}{netImpact.toLocaleString()}</p></div>{error && <p role="alert" className="text-sm text-rose-300 sm:col-span-2">{error}</p>}{message && <p role="status" className="text-sm text-emerald-300 sm:col-span-2">{message}</p>}<button className="btn-primary sm:col-span-2" type="button" onClick={save}>Save scenario</button></section><section className="mt-8"><h2 className="section-title">Saved scenarios</h2><div className="mt-4 space-y-3">{scenarios.map((scenario) => <div key={scenario.id} className="glass-card flex items-center justify-between gap-4 p-4"><span>{scenario.name}</span><button className="btn-ghost" type="button" onClick={() => remove(scenario.id)}>Delete</button></div>)}</div></section></div>;
}
