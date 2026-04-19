"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (err) {
        setError(
          err.message === "Invalid login credentials"
            ? "Ongeldige inloggegevens."
            : err.message,
        );
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError(
          "Geen sessie ontvangen. Controleer of e-mailbevestiging in Supabase staat uit of bevestig je account.",
        );
        setLoading(false);
        return;
      }

      const safeRedirect =
        redirect.startsWith("/") && !redirect.startsWith("//") ?
          redirect
        : "/dashboard";

      router.refresh();
      window.location.assign(safeRedirect);
    } catch (unknownErr) {
      const message =
        unknownErr instanceof Error ? unknownErr.message : "Inloggen mislukt.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
      <div className="text-center">
        <p className="font-serif text-2xl text-slate-900">RecruitAI</p>
        <p className="mt-1 text-sm text-muted">Log in op uw bureau-account</p>
      </div>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700"
          >
            Wachtwoord
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Bezig…" : "Inloggen"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/login#reset" className="text-primary hover:underline">
          Wachtwoord vergeten?
        </Link>
      </p>
    </div>
  );
}
