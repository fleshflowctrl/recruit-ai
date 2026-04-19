import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (secret && header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    bericht: "Beschikbaarheidscron — koppel Inngest of eigen logica.",
  });
}
