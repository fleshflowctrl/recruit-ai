import { BerichtenGrouped } from "@/components/whatsapp/BerichtenGrouped";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function BerichtenPage({
  searchParams,
}: {
  searchParams: Promise<{ kandidaat?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: berichten } = await supabase
    .from("berichten")
    .select("*, kandidaten(naam)")
    .eq("bureau_id", ctx.bureau.id)
    .order("aangemaakt_op", { ascending: true });

  const flat =
    berichten?.map((b) => ({
      id: b.id,
      inhoud: b.inhoud,
      richting: b.richting,
      aangemaakt_op: b.aangemaakt_op,
      kandidaat_id: b.kandidaat_id,
      gelezen: b.gelezen,
      kandidaten: b.kandidaten as { naam?: string } | null,
    })) ?? [];

  return (
    <div
      style={{
        height: "calc(100vh - 0px)",
        display: "flex",
        flexDirection: "column",
        background: "#FAFAF8",
      }}
      className="min-h-0 flex-1"
    >
      <div
        style={{
          padding: "20px 24px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 500,
            letterSpacing: "-0.3px",
            color: "#1A1A18",
          }}
        >
          Berichten
        </h1>
      </div>

      <BerichtenGrouped
        initial={flat}
        bureauId={ctx.bureau.id}
        initialKandidaatId={sp.kandidaat ?? null}
      />
    </div>
  );
}
