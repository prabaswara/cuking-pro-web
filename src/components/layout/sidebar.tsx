"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Beranda", icon: "pets" },
  { href: "/kucing", label: "Kucing", icon: "cruelty_free" },
  { href: "/paket", label: "Paket", icon: "workspace_premium" },
  { href: "/keuangan", label: "Keuangan", icon: "account_balance_wallet" },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
];

const conditionalItems = [
  { href: "/breeding", label: "Breeding", icon: "favorite", role: "breeder" },
  { href: "/jasa-pacak", label: "Jasa Pacak", icon: "cruelty_free", role: "stud" },
];

const secondaryItems = [
  { href: "/transfer", label: "Transfer Kucing", icon: "swap_horiz" },
  { href: "/riwayat-kepemilikan", label: "Riwayat Kepemilikan", icon: "history" },
];

type SidebarProps = {
  isBreeder: boolean;
  isStudProvider: boolean;
  userName: string;
  userEmail: string;
};

export function Sidebar({
  isBreeder,
  isStudProvider,
  userName,
  userEmail,
}: SidebarProps) {
  const pathname = usePathname();

  const flags: Record<string, boolean> = {
    breeder: isBreeder,
    stud: isStudProvider,
  };

  const visibleConditional = conditionalItems.filter((i) => flags[i.role]);

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col border-r border-sand-border bg-surface-card pt-16 md:flex">
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
                isActive
                  ? "bg-tangerine-subtle text-primary"
                  : "text-text-muted hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </Link>
          );
        })}

        {visibleConditional.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
                isActive
                  ? "bg-tangerine-subtle text-primary"
                  : "text-text-muted hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </Link>
          );
        })}

        <div className="mt-2 border-t border-sand-border pt-2">
          {secondaryItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? "bg-tangerine-subtle text-primary"
                    : "text-text-muted hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Info */}
      <div className="border-t border-sand-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-surface-container">
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="truncate font-semibold text-on-surface">{userName}</p>
            <p className="truncate text-sm text-text-muted">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}