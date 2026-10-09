"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HeatCycleList } from "@/components/breeding/heat-cycle-list";
import { MatingList } from "@/components/breeding/mating-list";
import { SalesList } from "@/components/penjualan/sales-list";

export default function BreedingPage() {
  const [isBreeder, setIsBreeder] = useState(false);
  const [activeTab, setActiveTab] = useState<"birahi" | "kawin" | "penjualan">("birahi");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cukingpro:isBreeder");
      setIsBreeder(stored === "true");
    } catch {}
  }, []);

  if (!isBreeder) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Breeding</h1>
          <p className="mt-1 text-text-muted">
            Kelola siklus birahi, kawin, kehamilan, dan kelahiran kucing
          </p>
        </div>

        <div className="rounded-3xl border-sand-border bg-surface-card p-8 text-center shadow-warm-sm">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-lavender-subtle">
            <span className="material-symbols-outlined text-3xl text-tertiary">pets</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Fitur Breeding Tersembunyi</h2>
          <p className="mt-2 max-w-md mx-auto text-text-muted">
            Aktifkan peran "Saya Breeder" di <Link href="/profil" className="text-primary underline">Profil</Link>
            untuk mengakses fitur pencatatan birahi, kawin, kehamilan, dan kelahiran.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/profil">
              <button className="h-12 rounded-full bg-primary px-6 font-semibold text-primary-foreground">
                Buka Profil
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Breeding</h1>
        <p className="mt-1 text-text-muted">
          Kelola siklus birahi, kawin, kehamilan, dan kelahiran kucing
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("birahi")}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "birahi"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface-card text-text-muted shadow-sm"
          }`}
        >
          Siklus Birahi
        </button>
        <button
          onClick={() => setActiveTab("kawin")}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "kawin"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface-card text-text-muted shadow-sm"
          }`}
        >
          Kawin & Kehamilan
        </button>
        <button
          onClick={() => setActiveTab("penjualan")}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "penjualan"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface-card text-text-muted shadow-sm"
          }`}
        >
          Penjualan
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "birahi" && (
        <div className="grid gap-6 md:grid-cols-2">
          <HeatCycleList catId="cat-mochi" catName="Mochi" />
          <HeatCycleList catId="cat-luna" catName="Luna" />
        </div>
      )}

      {activeTab === "kawin" && (
        <MatingList userId="user-1" />
      )}

      {activeTab === "penjualan" && (
        <SalesList userId="user-1" />
      )}
    </div>
  );
}