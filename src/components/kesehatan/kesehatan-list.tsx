"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HealthRecordCard } from "@/components/kesehatan/health-record-card";
import { getCatName, mockHealthRecords } from "@/lib/mock";

const FILTERS = [
  { value: "semua", label: "Semua" },
  { value: "vaccine", label: "Vaksinasi" },
  { value: "deworming", label: "Obat Cacing" },
  { value: "vet_visit", label: "Kunjungan Dokter" },
] as const;

interface KesehatanListProps {
  catId: string;
}

export function KesehatanList({ catId }: KesehatanListProps) {
  const [filter, setFilter] = useState<string>("semua");
  const catName = getCatName(catId);

  const records = mockHealthRecords.filter((r) => r.catId === catId);
  const visible =
    filter === "semua" ? records : records.filter((r) => r.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Rekam Medis</h3>
          <p className="text-sm text-text-muted">
            Riwayat tindakan klinis & pencegahan {catName}
          </p>
        </div>
        <Link href={`/kucing/${catId}/kesehatan/tambah`}>
          <Button className="h-10 rounded-full px-4">
            <span className="material-symbols-outlined mr-1 text-xl">add</span>
            Tambah
          </Button>
        </Link>
      </div>

      {/* Filter chips */}
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all active:scale-95 ${
              filter === f.value
                ? "bg-on-surface text-surface-card shadow-sm"
                : "bg-surface-card text-text-muted shadow-sm hover:text-on-surface"
            }`}
          >
            {f.label}
            {f.value === "semua" ? ` (${records.length})` : ""}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {visible.map((record) => (
            <HealthRecordCard key={record.id} record={record} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-3xl border border-sand-border bg-surface-card p-10 text-center shadow-warm-sm">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
            <span className="material-symbols-outlined text-3xl text-text-muted">
              folder_open
            </span>
          </div>
          <h4 className="font-bold text-on-surface">Belum Ada Rekam Medis</h4>
          <p className="mt-1 max-w-xs text-sm text-text-muted">
            Tidak ada catatan medis di kategori ini. Tambahkan riwayat baru
            untuk memantau kesehatan {catName}.
          </p>
          <Link href={`/kucing/${catId}/kesehatan/tambah`} className="mt-4">
            <Button className="h-10 rounded-full px-4">Tambah Catatan</Button>
          </Link>
        </div>
      )}

      <p className="rounded-2xl bg-surface-container-low p-3 text-center text-xs text-text-muted">
        Catatan ini bukan pengganti saran dokter hewan.
      </p>
    </div>
  );
}
