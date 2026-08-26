"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push("/dashboard/overview");
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center text-2xl font-bold gradient-text mb-8" style={{ fontFamily: "Syne,sans-serif" }}>ClaritySME</Link>
        <section className="glass-card p-8">
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-sm text-[#8888a4] mb-7">Sign in to continue to your financial workspace.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm text-[#c4c4d4]">Email<input className="input-field mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
            <label className="block text-sm text-[#c4c4d4]">Password<input className="input-field mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
            {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
            <button className="btn-primary w-full justify-center py-3" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
          </form>
          <p className="text-sm text-[#8888a4] text-center mt-6">New to ClaritySME? <Link href="/auth/signup" className="text-indigo-300 hover:text-indigo-200">Start your free trial</Link></p>
        </section>
      </div>
    </main>
  );
}
