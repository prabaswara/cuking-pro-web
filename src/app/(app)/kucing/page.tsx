"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { connection } from "next/server";
import { CatCard } from "@/components/kucing/cat-card";
import { mockCats } from "@/lib/mock";

export default async function KucingPage() {
  // Data kucing bersifat per-pengguna & per-request (nanti dari /api/cats).
  // connection() menandai halaman ini dynamic di bawah Cache Components.
  await connection();

  const cats = mockCats;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"semua" | "aktif" | "dilacak" | "dibekukan">("semua");
  const [sort, setSort] = useState<"terbaru" | "nama" | "umur">("terbaru");

  const filteredCats = cats.filter((cat) => {
    if (filter === "aktif" && cat.status !== "active") return false;
    if (filter === "dilacak" && cat.trackingStatus !== "tracked") return false;
    if (filter === "dibekukan" && cat.trackingStatus !== "frozen") return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !cat.name.toLowerCase().includes(q) &&
        !(cat.breed?.toLowerCase().includes(q)) &&
        !(cat.microchipNo?.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sort === "nama") return a.name.localeCompare(b.name);
    if (sort === "umur") return (b.birthDate ?? "").localeCompare(a.birthDate ?? "");
    return 0; // terbaru - mock sudah urut
  });

  const activeCount = cats.filter((c) => c.status === "active").length;
  const trackedCount = cats.filter((c) => c.trackingStatus === "tracked").length;
  const frozenCount = cats.filter((c) => c.trackingStatus === "frozen").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Kucing Saya</h1>
          <p className="mt-1 text-text-muted">Kelola semua anabulmu</p>
        </div>
        <Link href="/kucing/tambah">
          <Button className="rounded-full">
            <span className="material-symbols-outlined mr-2 text-xl">add</span>
            Tambah
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-text-muted">
            search
          </span>
          <Input
            placeholder="Cari nama, ras, atau microchip..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 rounded-2xl border-sand-border pl-11"
          />
        </div>
        <select
          aria-label="Urutkan kucing"
          value={sort}
          onChange={(e) => setSort(e.target.value as "terbaru" | "nama" | "umur")}
          className="h-12 rounded-2xl border-sand-border bg-surface-card px-4 text-sm font-medium text-on-surface"
        >
          <option value="terbaru">Terbaru</option>
          <option value="nama">Nama (A-Z)</option>
          <option value="umur">Umur</option>
        </select>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter("semua")}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            filter === "semua"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface-card text-text-muted shadow-sm"
          }`}
        >
          Semua ({cats.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("aktif")}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
            filter === "aktif"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface-card text-text-muted shadow-sm"
          }`}
        >
          Aktif ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("dilacak")}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
            filter === "dilacak"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface-card text-text-muted shadow-sm"
          }`}
        >
          Dilacak ({trackedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("dibekukan")}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
            filter === "dibekukan"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface-card text-text-muted shadow-sm"
          }`}
        >
          Dibekukan ({frozenCount})
        </button>
      </div>

      {/* Cat List (mock — ganti dengan /api/cats saat backend siap) */}
      {filteredCats.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {filteredCats.map((cat) => (
            <CatCard key={cat.id} cat={cat} />
          ))}
        </div>
      ) : (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low">
              <span className="material-symbols-outlined text-4xl text-text-muted">
                search_off
              </span>
            </div>
            <h3 className="text-lg font-semibold text-on-surface">
              {search ? "Tidak ada kucing yang cocok" : "Belum ada kucing"}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-text-muted">
              {search
                ? "Coba ubah kata kunci pencarian atau filter."
                : "Mulai tambahkan anabul pertamamu untuk mencatat kesehatan, vaksin, dan aktivitas harian mereka."}
            </p>
            {!search && (
              <Link href="/kucing/tambah" className="mt-6">
                <Button className="rounded-full px-6">
                  <span className="material-symbols-outlined mr-2 text-xl">add</span>
                  Tambah Kucing
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}