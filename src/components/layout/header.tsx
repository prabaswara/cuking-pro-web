"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function Header() {

  return (
    <header className="fixed top-0 z-50 w-full bg-peach-canvas/80 pt-safe backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" aria-label="cukingPro - Beranda">
          <Logo height={34} />
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            aria-label="Notifikasi"
          >
            <span className="material-symbols-outlined text-[22px]">
              notifications
            </span>
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-peach-canvas" />
          </button>

          {/* Profile */}
          <Link href="/profil">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-surface-container shadow-sm">
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[20px]">
                  person
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
