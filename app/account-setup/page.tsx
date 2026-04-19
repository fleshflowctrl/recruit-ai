import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";

export default async function AccountSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 shadow-sm">
        <h1 className="font-serif text-2xl text-slate-900">Account nog niet gekoppeld</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Je bent ingelogd, maar er is nog geen <strong>profiel</strong> gekoppeld aan een{" "}
          <strong>bureau</strong> in de database. Zonder die koppeling kan RecruitAI je geen gegevens
          tonen.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Voer in Supabase SQL uit (pas <code className="rounded bg-slate-100 px-1">USER_ID</code>{" "}
          aan naar jouw user-id uit Authentication → Users):
        </p>
        <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-100">
{`INSERT INTO bureaus (id, naam, email, plan, credits_resterend)
VALUES (
  gen_random_uuid(),
  'Mijn bureau',
  '${user.email ?? "email@voorbeeld.nl"}',
  'trial',
  50
) RETURNING id;

-- daarna met het bureau_id uit de vorige stap:
INSERT INTO profiles (id, bureau_id)
VALUES ('${user.id}', '<BUREAU_ID_HIER>');`}
        </pre>
        <p className="mt-4 text-xs text-muted">
          Of gebruik het seed-script in <code className="rounded bg-slate-100 px-1">supabase/seed.sql</code>.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <SignOutButton />
          <Link
            href="/login"
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Terug naar inloggen
          </Link>
        </div>
      </div>
    </div>
  );
}
