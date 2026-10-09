"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/dashboard",
    label: "Beranda",
    icon: "pets",
  },
  {
    href: "/kucing",
    label: "Kucing",
    icon: "cruelty_free",
  },
  {
    href: "/kucing/tambah",
    label: "Tambah",
    icon: "add_circle",
    isCenter: true,
  },
  {
    href: "/paket",
    label: "Paket",
    icon: "workspace_premium",
  },
  {
    href: "/pengaturan",
    label: "Menu",
    icon: "menu",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe md:hidden">
      <div className="mx-4 mb-4 rounded-3xl bg-surface-card/90 shadow-warm-md backdrop-blur-xl">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            const isCenter = "isCenter" in item && item.isCenter;

            if (isCenter) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-warm-md transition-transform active:scale-95"
                >
                  <span className="material-symbols-outlined text-[28px]">
                    {item.icon}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[52px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-full px-3 py-1 transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-tangerine-subtle text-primary"
                    : "text-text-muted hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {item.icon}
                </span>
                <span className="text-[11px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
