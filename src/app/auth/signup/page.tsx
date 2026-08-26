"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (signUpError) throw signUpError;
      if (data.session) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Unable to create your account.";
      setError(message === "Failed to fetch" ? "Cannot reach Supabase. Check that your project URL is real and that the project-root .env.local file is loaded, then restart the dev server." : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center text-2xl font-bold gradient-text mb-8" style={{ fontFamily: "Syne,sans-serif" }}>ClaritySME</Link>
        <section className="glass-card p-8">
          <h1 className="text-2xl font-bold mb-2">Start your free trial</h1>
          <p className="text-sm text-[#8888a4] mb-7">14 days free. No credit card required.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm text-[#c4c4d4]">Email<input className="input-field mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
            <label className="block text-sm text-[#c4c4d4]">Password<input className="input-field mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required autoComplete="new-password" /></label>
            {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
            {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
            <button className="btn-primary w-full justify-center py-3" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
          </form>
          <p className="text-sm text-[#8888a4] text-center mt-6">Already have an account? <Link href="/auth/login" className="text-indigo-300 hover:text-indigo-200">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
