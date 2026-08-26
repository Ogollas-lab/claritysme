"use client";

import { FormEvent, useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!file) { setError("Choose a CSV file first."); return; }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const result = await response.json() as { error?: string; rowsImported?: number; errors?: Array<{ row: number; message: string }> };
      if (!response.ok) throw new Error(result.error || "Upload failed");
      setMessage(`${result.rowsImported ?? 0} transactions imported successfully.${result.errors?.length ? ` ${result.errors.length} rows were skipped.` : ""}`);
      setFile(null);
      event.currentTarget.reset();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally { setUploading(false); }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <p className="label-sm">Data import</p>
      <h1 className="mt-2 text-3xl font-bold">Upload transactions</h1>
      <p className="mt-2 text-[#8888a4]">Import a CSV with date and amount columns. Description and category improve automatic classification.</p>
      <section className="glass-card mt-8 p-8">
        <form onSubmit={submit} className="space-y-6">
          <label className="block text-sm text-[#c4c4d4]">CSV file<input className="input-field mt-2 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-500 file:px-3 file:py-2 file:text-white" type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /></label>
          <div className="rounded-lg border border-white/10 bg-white/[.03] p-4 text-sm text-[#8888a4]"><p className="font-medium text-[#c4c4d4]">Required columns</p><p className="mt-1">Date: `date`, `transaction_date`, or `date_of_transaction`</p><p>Amount: `amount`, `value`, `sum`, or `total`</p></div>
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
          <button className="btn-primary py-3" type="submit" disabled={uploading}>{uploading ? "Importing..." : "Import CSV"}</button>
        </form>
      </section>
    </div>
  );
}
