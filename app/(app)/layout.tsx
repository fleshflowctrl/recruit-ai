import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
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
    <div className="flex min-h-screen bg-white">
      <Sidebar bureau={ctx.bureau} profile={ctx.profile} />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <main className="flex-1 p-4 pb-24 md:p-8 lg:pb-8">{children}</main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
