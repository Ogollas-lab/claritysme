import Link from "next/link";

const FEATURES = [
  { icon:"◈", title:"KPI Dashboards", desc:"Revenue, gross margin, burn rate, runway, payroll ratio — updated every sync." },
  { icon:"📈", title:"Revenue Forecasting", desc:"12-month projections with base, optimistic, and conservative scenarios." },
  { icon:"💧", title:"Cash Flow Forecast", desc:"13-week rolling cash position with week-level red/amber/green status." },
  { icon:"🔮", title:"Scenario Planner", desc:"Model a new hire or lost client and see the instant impact on runway." },
  { icon:"🔔", title:"Smart Alerts", desc:"Automatic warnings for low runway, margin drops, and high payroll ratio." },
  { icon:"✦", title:"AI Insights", desc:"Claude-powered health summaries, benchmark comparisons, and cost alerts." },
  { icon:"💬", title:"AI Chat", desc:"Ask questions about your financials in plain English. Answered with your live data." },
  { icon:"📋", title:"Board Pack Reports", desc:"One-click report with KPIs, P&L, benchmarks, and cash forecast. Print to PDF." },
  { icon:"📊", title:"Industry Benchmarks", desc:"Compare gross margin and payroll ratio against peers in 7 industries." },
];

const PRICING = [
  { tier:"Starter", price:49, highlight:false, anchor:null, features:["3 KPI dashboards","5 reports/month","Basic forecasting","Industry benchmarks","CSV upload","1 user"] },
  { tier:"Growth", price:129, highlight:true, anchor:"Most popular", features:["10 KPI dashboards","20 reports/month","Advanced forecasting","Peer benchmarking","AI Chat & Insights","Scenario planner","5 users"] },
  { tier:"Scale", price:299, highlight:false, anchor:"Best value", features:["Unlimited dashboards","Unlimited reports","AI-powered forecasting","Custom benchmarks","Board pack automation","API access","Unlimited users"] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f8f8fc]">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold gradient-text" style={{fontFamily:"Syne,sans-serif"}}>ClaritySME</span>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost py-1.5 px-4 text-sm">Sign in</Link>
            <Link href="/auth/signup" className="btn-primary py-1.5 px-4 text-sm">Start free trial →</Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[140px]" style={{background:"rgba(99,102,241,0.1)"}} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Beta · 14-day free trial · No credit card
          </div>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-tight mb-6" style={{fontFamily:"Syne,sans-serif"}}>
            <span className="text-white">Your business,</span><br />
            <span className="gradient-text">finally clear.</span>
          </h1>
          <p className="text-xl text-[#8888a4] max-w-2xl mx-auto leading-relaxed mb-10">
            Real-time KPI dashboards, AI insights, cash flow forecasts, and board-ready reports — without a finance team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="btn-primary text-base px-8 py-3.5">Start free trial →</Link>
            <Link href="/auth/login" className="btn-ghost text-base px-8 py-3.5">Sign in</Link>
          </div>
          <p className="text-sm text-[#55556a] mt-5">Trusted by agencies, consultancies, MSPs, and SaaS founders in 15+ countries</p>
        </div>
      </section>

      <section className="px-6 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3" style={{fontFamily:"Syne,sans-serif"}}>Everything your finance team would build</h2>
            <p className="text-[#8888a4] max-w-xl mx-auto">Nine integrated features that give you a complete picture of your financial health.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="glass-card p-6 space-y-3">
                <span className="text-2xl">{f.icon}</span>
                <h3 className="font-semibold text-[#f8f8fc]" style={{fontFamily:"Syne,sans-serif"}}>{f.title}</h3>
                <p className="text-sm text-[#8888a4] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{fontFamily:"Syne,sans-serif"}}>Simple, transparent pricing</h2>
            <p className="text-[#8888a4]">14-day free trial on all plans. No credit card required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PRICING.map(p => (
              <div key={p.tier} className={`relative glass-card p-7 flex flex-col gap-5 ${p.highlight?"border-indigo-500/40 ring-1 ring-indigo-500/20":""}`}>
                {p.anchor && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-semibold">{p.anchor}</div>
                )}
                <div>
                  <p className="text-sm font-medium text-[#8888a4] mb-1">{p.tier}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold" style={{fontFamily:"Syne,sans-serif"}}>${p.price}</span>
                    <span className="text-[#55556a] text-sm">/month</span>
                  </div>
                </div>
                <ul className="space-y-2 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#c4c4d4]"><span className="text-emerald-400">✓</span>{f}</li>
                  ))}
                </ul>
                <Link href="/auth/signup" className={p.highlight?"btn-primary w-full justify-center py-3":"btn-ghost w-full justify-center py-3"}>Start free trial →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#55556a]">
          <span className="font-bold gradient-text text-base" style={{fontFamily:"Syne,sans-serif"}}>ClaritySME</span>
          <p>© 2026 ClaritySME. Built for SMEs, by people who&apos;ve been there.</p>
          <a href="mailto:hello@claritysme.io" className="hover:text-[#8888a4] transition-colors">hello@claritysme.io</a>
        </div>
      </footer>
    </div>
  );
}
