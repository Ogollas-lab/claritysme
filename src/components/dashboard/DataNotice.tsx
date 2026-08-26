import Link from "next/link";

export function DataNotice({ title = "Add your financial data", detail = "Upload transactions to populate this workspace." }: { title?: string; detail?: string }) {
  return <section className="glass-card mt-8 p-8"><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 text-[#8888a4]">{detail}</p><Link href="/dashboard/upload" className="btn-primary mt-6">Upload transactions</Link></section>;
}
