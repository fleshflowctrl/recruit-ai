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
    <div className="flex min-h-0 flex-1 flex-col bg-[#FAFAF8]">
      <div className="flex shrink-0 items-center justify-between px-1 pb-3 pt-1 sm:px-0 sm:pb-4 sm:pt-0">
        <h1
          className="text-[20px] font-medium tracking-[-0.3px] text-[#1A1A18] sm:text-[22px]"
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
