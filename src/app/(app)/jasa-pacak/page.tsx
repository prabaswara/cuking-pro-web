"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StudServiceList } from "@/components/pacak/stud-service-list";
import { StudBookingList } from "@/components/pacak/stud-booking-list";

export default function JasaPacakPage() {
  const [isStudProvider, setIsStudProvider] = useState(false);
  const [activeTab, setActiveTab] = useState<"pejantan" | "booking">("booking");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cukingpro:isStudProvider");
      setIsStudProvider(stored === "true");
    } catch {}
  }, []);

  if (!isStudProvider) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Jasa Pacak</h1>
          <p className="mt-1 text-text-muted">
            Kelola pejantan pacak dan booking klien
          </p>
        </div>

        <div className="rounded-3xl border-sand-border bg-surface-card p-8 text-center shadow-warm-sm">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-lavender-subtle">
            <span className="material-symbols-outlined text-3xl text-tertiary">cruelty_free</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Fitur Jasa Pacak Tersembunyi</h2>
          <p className="mt-2 max-w-md mx-auto text-text-muted">
            Aktifkan peran "Saya Menyediakan Jasa Pacak" di <Link href="/profil" className="text-primary underline">Profil</Link>
            untuk mengakses fitur manajemen pejantan pacak dan booking klien.
          </p>
          <div className="mt-6">
            <Link href="/profil">
              <span className="inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">
                Buka Profil
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Jasa Pacak</h1>
        <p className="mt-1 text-text-muted">
          Kelola pejantan pacak dan booking klien
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("pejantan")}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "pejantan"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface-card text-text-muted shadow-sm"
          }`}
        >
          Pejantan Pacak
        </button>
        <button
          onClick={() => setActiveTab("booking")}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "booking"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface-card text-text-muted shadow-sm"
          }`}
        >
          Booking
        </button>
      </div>

      {activeTab === "pejantan" && <StudServiceList />}
      {activeTab === "booking" && <StudBookingList />}
    </div>
  );
}