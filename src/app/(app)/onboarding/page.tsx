"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

const subscribe = () => () => {};

function readFlag(key: string): string {
  if (typeof window === "undefined") return "false";
  try {
    return localStorage.getItem(key) === "true" ? "true" : "false";
  } catch {
    return "false";
  }
}

interface RoleOption {
  key: "isBreeder" | "isStudProvider";
  storageKey: string;
  icon: string;
  title: string;
  description: string;
  accent: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    key: "isBreeder",
    storageKey: "cukingpro:isBreeder",
    icon: "pets",
    title: "Saya Breeder",
    description:
      "Catat siklus birahi, kawin, kehamilan, kelahiran, dan penjualan anak kucing.",
    accent: "bg-lavender-subtle text-tertiary",
  },
  {
    key: "isStudProvider",
    storageKey: "cukingpro:isStudProvider",
    icon: "workspace_premium",
    title: "Saya Menyediakan Jasa Pacak",
    description:
      "Tawarkan pejantan pacak dan kelola booking kawin dari klien.",
    accent: "bg-tangerine-subtle text-primary",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const breederStored = useSyncExternalStore(
    subscribe,
    () => readFlag("cukingpro:isBreeder"),
    () => "false",
  );
  const studStored = useSyncExternalStore(
    subscribe,
    () => readFlag("cukingpro:isStudProvider"),
    () => "false",
  );
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const isBreeder = overrides.isBreeder ?? breederStored === "true";
  const isStudProvider = overrides.isStudProvider ?? studStored === "true";

  function toggle(key: RoleOption["key"]) {
    const current = key === "isBreeder" ? isBreeder : isStudProvider;
    setOverrides((prev) => ({ ...prev, [key]: !current }));
  }

  function handleContinue() {
    try {
      localStorage.setItem("cukingpro:isBreeder", String(isBreeder));
      localStorage.setItem("cukingpro:isStudProvider", String(isStudProvider));
      // Tandai onboarding selesai (dipakai untuk banner di Beranda)
      localStorage.setItem("cukingpro:onboarded", "true");
    } catch {}
    router.push("/dashboard");
  }

  const anySelected = isBreeder || isStudProvider;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      {/* Intro */}
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Logo height={56} />
        </div>
        <h1 className="text-2xl font-bold text-on-surface">Kamu siapa? 🐾</h1>
        <p className="mx-auto mt-2 max-w-md text-text-muted">
          Pilih peran kamu untuk menyesuaikan menu dan fitur. Semua pemilik
          kucing otomatis aktif — kamu bisa mengubahnya kapan saja di Profil.
        </p>
      </div>

      {/* Role cards */}
      <div className="space-y-3">
        {ROLE_OPTIONS.map((role) => {
          const active =
            role.key === "isBreeder" ? isBreeder : isStudProvider;
          return (
            <button
              key={role.key}
              type="button"
              onClick={() => toggle(role.key)}
              className={`flex w-full items-center gap-4 rounded-3xl border p-5 text-left transition-all active:scale-[0.99] ${
                active
                  ? "border-primary bg-surface-card shadow-warm-md"
                  : "border-sand-border bg-surface-card shadow-warm-sm"
              }`}
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${role.accent}`}
              >
                <span className="material-symbols-outlined text-3xl">
                  {role.icon}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-on-surface">{role.title}</p>
                <p className="mt-0.5 text-sm text-text-muted">
                  {role.description}
                </p>
              </div>
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-sand-border bg-surface-card"
                }`}
              >
                {active && (
                  <span className="material-symbols-outlined text-base">check</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Note */}
      <div className="rounded-2xl bg-mint-subtle/70 p-4 text-sm text-secondary">
        <p className="font-semibold">Pemilik kucing aktif otomatis</p>
        <p className="mt-0.5 text-on-surface-variant">
          Kamu sudah bisa menambah kucing dan mencatat kesehatan sekalipun tidak
          memilih peran di atas.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={handleContinue}
          className="h-14 w-full rounded-full text-base font-semibold"
        >
          Lanjut ke Beranda
        </Button>
        <p className="text-center text-sm text-text-muted">
          {anySelected
            ? "Peran bisa diubah nanti di halaman Profil."
            : "Kamu bisa lewati dan mengaturnya nanti di Profil."}
        </p>
      </div>
    </div>
  );
}
