import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const flowStepSchema = z.object({
  id: z.string().uuid(),
  kind: z.string(),
  enabled: z.boolean(),
});

const bodySchema = z.object({
  flow: z.array(flowStepSchema),
  settings: z.record(z.string(), z.unknown()),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("bureau_id")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "Geen profiel" }, { status: 403 });
  }

  const { data: row } = await supabase
    .from("automatisering_flows")
    .select("id, bureau_id, flow, settings, aangemaakt_op, bijgewerkt_op")
    .eq("bureau_id", profile.bureau_id)
    .maybeSingle();

  return NextResponse.json({
    flow: row?.flow ?? [],
    settings: row?.settings ?? {},
    meta: row
      ? {
          id: row.id,
          bijgewerkt_op: row.bijgewerkt_op,
        }
      : null,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("bureau_id")
    .eq("id", user.id)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "Geen profiel" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { flow, settings } = parsed.data;

  const { data: existing } = await supabase
    .from("automatisering_flows")
    .select("id")
    .eq("bureau_id", profile.bureau_id)
    .maybeSingle();

  const payload = {
    bureau_id: profile.bureau_id,
    flow,
    settings,
    bijgewerkt_op: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("automatisering_flows")
      .update({
        flow: payload.flow,
        settings: payload.settings,
        bijgewerkt_op: payload.bijgewerkt_op,
      })
      .eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("automatisering_flows").insert(payload);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
