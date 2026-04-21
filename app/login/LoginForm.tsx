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

  const supabaseConfigured =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    ((typeof process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === "string" &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.length > 0) ||
      (typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!supabaseConfigured) {
      setError(
        "Supabase is niet geconfigureerd in deze omgeving. Stel NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (of NEXT_PUBLIC_SUPABASE_ANON_KEY) in op Vercel en deploy opnieuw.",
      );
      setLoading(false);
      return;
    }

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
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        fontFamily: "-apple-system, system-ui, sans-serif",
      }}
    >
      {/* LEFT SIDE - Dark branding panel */}
      <div
        style={{
          flex: 1,
          background: "#1A1A18",
          padding: "48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          minWidth: 0,
        }}
        className="hidden md:flex"
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            right: "-80px",
            top: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(200,180,100,0.05)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "-60px",
            bottom: "-60px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(200,180,100,0.04)",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
        <div
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#F5F4F0",
            letterSpacing: "0.02em",
            fontFamily: "'SF Mono', ui-monospace, monospace",
            position: "relative",
            zIndex: 1,
          }}
        >
          RecruitAI
        </div>

        {/* Center content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: 500,
              color: "#F5F4F0",
              lineHeight: 1.25,
              letterSpacing: "-0.5px",
              marginBottom: "14px",
            }}
          >
            AI recruteert.
            <br />
            <span style={{ color: "#C8B47A" }}>Jij plaatst.</span>
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "rgba(245,244,240,0.4)",
              lineHeight: 1.7,
              maxWidth: "300px",
              marginBottom: "36px",
            }}
          >
            Het autonome recruitment platform dat kandidaten belt, screent en
            rapporteert — zodat jij je focust op wat écht telt.
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
            {[
              "AI belt kandidaten in perfect Nederlands",
              "Automatische screening met score en rapport",
              "WhatsApp bevestigingen automatisch verstuurd",
              "No-show preventie en check-ins inbegrepen",
            ].map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#C8B47A",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    color: "rgba(245,244,240,0.55)",
                  }}
                >
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: "11px",
            color: "rgba(245,244,240,0.2)",
            position: "relative",
            zIndex: 1,
          }}
        >
          © 2026 RecruitAI
        </div>
      </div>

      {/* RIGHT SIDE - Login form */}
      <div
        style={{
          width: "100%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAF8",
        }}
        className="w-full max-w-full px-6 py-8 md:w-[420px] md:max-w-[420px] md:flex-shrink-0 md:px-10 md:py-12"
      >
        <div style={{ width: "100%" }}>
          {/* Mobile logo (only on mobile) */}
          <div
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#1A1A18",
              fontFamily: "'SF Mono', ui-monospace, monospace",
              marginBottom: "32px",
            }}
            className="block md:hidden"
          >
            RecruitAI
          </div>

          {/* Desktop small logo */}
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#B0AFA9",
              letterSpacing: "0.05em",
              fontFamily: "'SF Mono', ui-monospace, monospace",
              marginBottom: "32px",
            }}
            className="hidden md:block"
          >
            RecruitAI
          </div>

          <h2
            style={{
              fontSize: "22px",
              fontWeight: 500,
              color: "#1A1A18",
              letterSpacing: "-0.3px",
              marginBottom: "5px",
            }}
          >
            Welkom terug
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "#8A8A85",
              marginBottom: "28px",
            }}
          >
            Log in op uw bureau-account
          </p>

          {/* FORM — keep existing onSubmit */}
          <form onSubmit={onSubmit}>
            {/* Email field */}
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="email"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#8A8A85",
                  marginBottom: "6px",
                  display: "block",
                }}
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
                placeholder="naam@bureau.nl"
                style={{
                  width: "100%",
                  background: "#F5F4F0",
                  border: "1px solid rgba(0,0,0,0.09)",
                  borderRadius: "8px",
                  padding: "11px 14px",
                  fontSize: "14px",
                  color: "#1A1A18",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(0,0,0,0.25)";
                  e.target.style.background = "white";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(0,0,0,0.09)";
                  e.target.style.background = "#F5F4F0";
                }}
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: "8px" }}>
              <label
                htmlFor="password"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#8A8A85",
                  marginBottom: "6px",
                  display: "block",
                }}
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
                placeholder="••••••••"
                style={{
                  width: "100%",
                  background: "#F5F4F0",
                  border: "1px solid rgba(0,0,0,0.09)",
                  borderRadius: "8px",
                  padding: "11px 14px",
                  fontSize: "14px",
                  color: "#1A1A18",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(0,0,0,0.25)";
                  e.target.style.background = "white";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(0,0,0,0.09)";
                  e.target.style.background = "#F5F4F0";
                }}
              />
            </div>

            {/* Error message */}
            {error && (
              <p
                style={{
                  fontSize: "13px",
                  color: "#8B2020",
                  background: "#F5D9D9",
                  border: "1px solid rgba(139,32,32,0.15)",
                  borderRadius: "7px",
                  padding: "10px 12px",
                  marginBottom: "8px",
                }}
                role="alert"
              >
                {error}
              </p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: "#1A1A18",
                color: "#FAFAF8",
                border: "none",
                padding: "12px",
                borderRadius: "9px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                marginTop: "8px",
                transition: "opacity 150ms",
              }}
            >
              {loading ? "Bezig…" : "Inloggen"}
            </button>
          </form>

          {/* Forgot password */}
          <div
            style={{
              textAlign: "center",
              marginTop: "18px",
            }}
          >
            <Link
              href="/login#reset"
              style={{
                fontSize: "13px",
                color: "#B0AFA9",
                textDecoration: "none",
              }}
            >
              Wachtwoord vergeten?
            </Link>
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              background: "rgba(0,0,0,0.07)",
              margin: "24px 0",
            }}
          />

          {/* Bottom note */}
          <p
            style={{
              fontSize: "12px",
              color: "#B0AFA9",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            Nog geen account? Neem contact op via{" "}
            <span style={{ color: "#1A1A18", fontWeight: 500 }}>
              info@recruitai.nl
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
