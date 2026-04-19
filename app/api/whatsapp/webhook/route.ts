import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const data = (body.data ?? body) as Record<string, unknown>;
  const rawFrom = data.from as Record<string, unknown> | string | undefined;
  const from = String(
    typeof rawFrom === "object" && rawFrom && "phone_number" in rawFrom
      ? rawFrom.phone_number
      : rawFrom ?? "",
  );
  const text = String(data.text ?? data.body ?? "");
  const admin = createAdminClient();

  const { data: kandidaat } = await admin
    .from("kandidaten")
    .select("*")
    .eq("telefoon", from)
    .maybeSingle();

  if (kandidaat && text) {
    await admin.from("berichten").insert({
      bureau_id: kandidaat.bureau_id,
      kandidaat_id: kandidaat.id,
      kanaal: "whatsapp",
      richting: "inbound",
      inhoud: text,
      status: "ontvangen",
    });
  }

  return NextResponse.json({ ok: true });
}
