"use client";

import { useState } from "react";
import { HeatCycleManager } from "@/components/breeding/heat-cycle-manager";
import { MatingManager } from "@/components/breeding/mating-manager";
import { SalesManager } from "@/components/breeding/sales-manager";
import type { HeatCycleWithCat } from "@/lib/heat-cycles";
import type { MatingWithDetails } from "@/lib/matings";
import type { SaleWithCat, SalesSummary } from "@/lib/sales";

export type BreedingCatOption = {
  id: string;
  name: string;
  sex: "male" | "female";
  breed: string | null;
  sireId: string | null;
  damId: string | null;
};

type Slice<T> = {
  items: T[];
  lockedCount: number;
  windowStart: string | null;
};

export function BreedingTabs({
  heatCycles,
  matings,
  sales,
  summary,
  females,
  males,
  saleCats,
}: {
  heatCycles: Slice<HeatCycleWithCat>;
  matings: Slice<MatingWithDetails>;
  sales: Slice<SaleWithCat>;
  summary: SalesSummary;
  females: BreedingCatOption[];
  males: BreedingCatOption[];
  saleCats: { id: string; name: string; photoPath: string | null }[];
}) {
  const [activeTab, setActiveTab] = useState<"birahi" | "kawin" | "penjualan">(
    "birahi",
  );

  const tabs = [
    { value: "birahi", label: "Siklus Birahi" },
    { value: "kawin", label: "Kawin & Kehamilan" },
    { value: "penjualan", label: "Penjualan" },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Breeding</h1>
        <p className="mt-1 text-text-muted">
          Kelola siklus birahi, kawin, kehamilan, kelahiran, dan penjualan
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === tab.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface-card text-text-muted shadow-sm"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "birahi" && (
        <HeatCycleManager initial={heatCycles} females={females} />
      )}

      {activeTab === "kawin" && (
        <MatingManager
          initial={matings}
          females={females}
          males={males}
        />
      )}

      {activeTab === "penjualan" && (
        <SalesManager
          initial={sales}
          summary={summary}
          cats={saleCats}
        />
      )}
    </div>
  );
}
