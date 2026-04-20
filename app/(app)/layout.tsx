import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MockBanner } from "@/components/layout/MockBanner";
import { ToasterProvider } from "@/components/providers/ToasterProvider";
import { getSessionContext } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  return (
    <>
      <MockBanner />
      <ToasterProvider />
      <div className="flex min-h-screen bg-[var(--cream-bg)]">
        <MobileHeader />
        <Sidebar bureau={ctx.bureau} profile={ctx.profile} />
        <div className="flex min-h-screen flex-1 flex-col pt-14 md:pt-0 md:pl-[220px]">
          <main className="flex-1 p-6 pb-24 md:pb-8">{children}</main>
          <MobileBottomNav />
        </div>
      </div>
    </>
  );
}
