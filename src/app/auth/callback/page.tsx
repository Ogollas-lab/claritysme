"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    async function exchangeCode() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) {
        setError("This confirmation link is missing its code.");
        return;
      }

      try {
        const supabase = createClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        router.replace("/onboarding");
        router.refresh();
      } catch (callbackError) {
        setError(callbackError instanceof Error ? callbackError.message : "Unable to confirm your account.");
      }
    }

    void exchangeCode();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <section className="glass-card p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold mb-3">Confirming your account</h1>
        {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : <p className="text-sm text-[#8888a4]">One moment while we finish signing you in.</p>}
      </section>
    </main>
  );
}
