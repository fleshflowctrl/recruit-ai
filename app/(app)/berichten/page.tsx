import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { WhatsAppInbox } from "@/components/whatsapp/WhatsAppInbox";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function BerichtenPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const { data: berichten } = await supabase
    .from("berichten")
    .select("*, kandidaten(naam)")
    .eq("bureau_id", ctx.bureau.id)
    .order("aangemaakt_op", { ascending: false })
    .limit(50);

  const flat =
    berichten?.map((b) => ({
      id: b.id,
      inhoud: b.inhoud,
      richting: b.richting,
      aangemaakt_op: b.aangemaakt_op,
      kandidaten: b.kandidaten as { naam?: string } | null,
    })) ?? [];

  return (
    <PageWrapper>
      <Header title="Berichten" />
      <WhatsAppInbox berichten={flat} />
    </PageWrapper>
  );
}
