import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Check if user is authenticated
  // If not authenticated, redirect to login
  // const session = await getSession();
  // if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-peach-canvas">
      <Header />

      <div className="flex">
        {/* Sidebar - Desktop only (pakai usePathname → bungkus Suspense agar bisa prerender) */}
        <Suspense>
          <Sidebar />
        </Suspense>

        {/* Main Content */}
        <main className="flex-1 pb-20 pt-16 md:pb-0 md:pl-64">
          <div className="mx-auto max-w-4xl px-4 py-6">{children}</div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile only (pakai usePathname → bungkus Suspense) */}
      <Suspense>
        <BottomNav />
      </Suspense>
    </div>
  );
}
