"use client";

import { useState, useEffect } from "react";
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
    href: "/paket",
    label: "Paket",
    icon: "workspace_premium",
  },
  {
    href: "/pengaturan",
    label: "Pengaturan",
    icon: "settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isBreeder, setIsBreeder] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cukingpro:isBreeder");
      setIsBreeder(stored === "true");
    } catch {}
  }, []);

  const breedingNav = isBreeder
    ? {
        href: "/breeding",
        label: "Breeding",
        icon: "pets",
      }
    : null;

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col border-r border-sand-border bg-surface-card pt-16 md:flex">
      <nav className="flex flex-1 flex-col gap-1 p-4">
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
              <span className="material-symbols-outlined text-[24px]">
                {item.icon}
              </span>
              <span className="font-semibold">{item.label}</span>
            </Link>
          );
        })}
        {breedingNav && (
          <Link
            key={breedingNav.href}
            href={breedingNav.href}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
              pathname.startsWith("/breeding")
                ? "bg-tangerine-subtle text-primary"
                : "text-text-muted hover:bg-surface-container-low hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {breedingNav.icon}
            </span>
            <span className="font-semibold">{breedingNav.label}</span>
          </Link>
        )}
      </nav>

      {/* User Info */}
      <div className="border-t border-sand-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-surface-container">
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[20px]">
                person
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-on-surface">Pengguna</p>
            <p className="text-sm text-text-muted">user@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
