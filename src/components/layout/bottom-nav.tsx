"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const subscribe = () => () => {};

function readFlag(key: string): string {
  if (typeof window === "undefined") return "false";
  try {
    return localStorage.getItem(key) === "true" ? "true" : "false";
  } catch {
    return "false";
  }
}

export function BottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isBreeder =
    useSyncExternalStore(
      subscribe,
      () => readFlag("cukingpro:isBreeder"),
      () => "false",
    ) === "true";
  const isStudProvider =
    useSyncExternalStore(
      subscribe,
      () => readFlag("cukingpro:isStudProvider"),
      () => "false",
    ) === "true";

  const items: { href: string; label: string; icon: string; show: boolean }[] = [
    { href: "/dashboard", label: "Beranda", icon: "pets", show: true },
    { href: "/kucing", label: "Kucing", icon: "cruelty_free", show: true },
    { href: "/breeding", label: "Breeding", icon: "favorite", show: isBreeder },
    { href: "/jasa-pacak", label: "Jasa Pacak", icon: "cruelty_free", show: isStudProvider },
  ];

  const visible = items.filter((i) => i.show);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe md:hidden">
        <div className="mx-4 mb-4 rounded-3xl bg-surface-card/90 shadow-warm-md backdrop-blur-xl">
          <div className="flex items-center justify-around px-2 py-2">
            {visible.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[52px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-full px-3 py-1 transition-all duration-200 active:scale-95 ${
                  isActive(item.href)
                    ? "bg-tangerine-subtle text-primary"
                    : "text-text-muted hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                <span className="text-[11px] font-semibold">{item.label}</span>
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={`flex min-h-[52px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-full px-3 py-1 transition-all duration-200 active:scale-95 ${
                menuOpen ? "bg-tangerine-subtle text-primary" : "text-text-muted hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
              <span className="text-[11px] font-semibold">Menu</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Menu Sheet */}
      {menuOpen && (
        <div className="fixed inset-0 z-55 md:hidden">
          <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-surface-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-surface-container" />
            <div className="flex flex-col gap-2">
              <MenuLink href="/keuangan" icon="account_balance_wallet" label="Keuangan" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/paket" icon="workspace_premium" label="Paket" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/notifikasi" icon="notifications" label="Notifikasi" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/riwayat-kepemilikan" icon="history" label="Riwayat Kepemilikan" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/profil" icon="person" label="Profil" onClick={() => setMenuOpen(false)} />
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="mt-4 h-12 w-full rounded-full bg-surface-container font-semibold text-on-surface"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function MenuLink({ href, icon, label, onClick }: { href: string; icon: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface-container-low p-3 transition-transform active:scale-95"
    >
      <span className="material-symbols-outlined text-2xl text-primary">{icon}</span>
      <span className="text-[11px] font-semibold text-on-surface">{label}</span>
    </Link>
  );
}