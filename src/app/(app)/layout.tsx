import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { getOrCreateProfile } from "@/lib/profile";
import { getSession } from "@/lib/session";

export const instant = false;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Area aplikasi selalu per-request (sesi) — tidak boleh di-prerender.
  await connection();

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await getOrCreateProfile(session.user.id);

  return (
    <div className="min-h-screen bg-peach-canvas">
      <Header />

      <div className="flex">
        {/* Sidebar - Desktop only (pakai usePathname → bungkus Suspense agar bisa prerender) */}
        <Suspense>
          <Sidebar
            isBreeder={profile.isBreeder}
            isStudProvider={profile.isStudProvider}
            userName={session.user.name}
            userEmail={session.user.email}
          />
        </Suspense>

        {/* Main Content */}
        <main className="flex-1 pb-20 pt-16 md:pb-0 md:pl-64">
          <div className="mx-auto max-w-4xl px-4 py-6">{children}</div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile only (pakai usePathname → bungkus Suspense) */}
      <Suspense>
        <BottomNav
          isBreeder={profile.isBreeder}
          isStudProvider={profile.isStudProvider}
        />
      </Suspense>
    </div>
  );
}
