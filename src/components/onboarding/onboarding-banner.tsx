"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

const subscribe = () => () => {};

function readOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("cukingpro:onboarded") !== "true";
  } catch {
    return false;
  }
}

export function OnboardingBanner() {
  const show = useSyncExternalStore(subscribe, readOnboarded, () => false);

  if (!show) return null;

  return (
    <Link
      href="/onboarding"
      className="flex items-center gap-4 rounded-3xl border border-sand-border bg-tangerine-subtle p-4 shadow-warm-sm transition-transform active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <span className="material-symbols-outlined text-2xl">waving_hand</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-on-surface">
          Lengkapi profil kamu
        </p>
        <p className="text-sm text-on-surface-variant">
          Pilih peran sebagai breeder atau penyedia jasa pacak untuk membuka
          menu yang sesuai.
        </p>
      </div>
      <span className="material-symbols-outlined shrink-0 text-2xl text-primary">
        chevron_right
      </span>
    </Link>
  );
}
