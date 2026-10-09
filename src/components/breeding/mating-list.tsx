"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateID, getMatingsForUser, getQueenDisplayName, getSireDisplayName, getLitterByMating, getCatName } from "@/lib/mock";
import type { Mating } from "@/types";

const OUTCOME_STYLE: Record<Mating["outcome"], { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-subtle", text: "text-honey-amber", label: "Menunggu Konfirmasi" },
  pregnant: { bg: "bg-error-container", text: "text-error", label: "Hamil" },
  not_pregnant: { bg: "bg-surface-container", text: "text-on-surface-variant", label: "Tidak Hamil" },
  delivered: { bg: "bg-mint-subtle", text: "text-secondary", label: "Sudah Melahirkan" },
};

interface MatingListProps {
  userId: string;
}

export function MatingList({ userId }: MatingListProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"semua" | "pregnant" | "pending" | "history">("semua");
  const matings = getMatingsForUser(userId);

  const visible = matings.filter((m) => {
    if (filter === "semua") return true;
    if (filter === "pregnant") return m.outcome === "pregnant";
    if (filter === "pending") return m.outcome === "pending";
    if (filter === "history") return m.outcome === "not_pregnant" || m.outcome === "delivered";
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Catatan Kawin & Kehamilan</h3>
          <p className="text-sm text-text-muted">Pantau kawin dan kehamilan kucing</p>
        </div>
        <Button onClick={() => setOpen(true)} className="h-10 rounded-full px-4">
          <span className="material-symbols-outlined mr-1 text-xl">add</span>
          Catat Kawin
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["semua", "pregnant", "pending", "history"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface-card text-text-muted shadow-sm"
            }`}
          >
            {f === "semua" ? "Semua" : f === "pregnant" ? "Hamil" : f === "pending" ? "Menunggu" : "Riwayat"}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center rounded-3xl p-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-3xl text-text-muted">pets</span>
            </div>
            <h4 className="font-bold text-on-surface">Belum Ada Catatan Kawin</h4>
            <p className="mt-1 max-w-xs text-sm text-text-muted">
              Catat kawin pertama untuk memulai pemantauan kehamilan.
            </p>
            <Button onClick={() => setOpen(true)} className="mt-4 h-10 rounded-full px-4">
              Catat Kawin Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((mating) => (
            <MatingCard key={mating.id} mating={mating} />
          ))}
        </div>
      )}

      {/* Modal catat kawin */}
      {open && <MatingForm onClose={() => setOpen(false)} />}
    </div>
  );
}

function MatingCard({ mating }: { mating: Mating }) {
  const style = OUTCOME_STYLE[mating.outcome];
  const litter = getLitterByMating(mating.id);
  const queenName = getQueenDisplayName(mating);
  const sireName = getSireDisplayName(mating);
  const isPregnant = mating.outcome === "pregnant";

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lavender-subtle text-tertiary">
              <span className="material-symbols-outlined text-xl">favorite</span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-on-surface truncate">{queenName}</p>
                <span className="text-text-muted">×</span>
                <p className="font-medium text-on-surface truncate">{sireName}</p>
              </div>
              <p className="text-sm text-text-muted">Kawin: {formatDateID(mating.matingDate)}</p>
            </div>
          </div>
          <Badge variant="outline" className={`${style.bg} ${style.text}`}>
            {style.label}
          </Badge>
        </div>

        {isPregnant && mating.expectedDueDate && (
          <div className="mt-3 rounded-2xl bg-error-container/20 p-3 border border-error-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error">schedule</span>
                <span className="font-semibold text-error">Estimasi Lahir: {formatDateID(mating.expectedDueDate)}</span>
              </div>
              <Link href={`/breeding/kehamilan/${mating.id}`}>
                <Button size="sm" className="h-8 rounded-full">Catat Kelahiran</Button>
              </Link>
            </div>
          </div>
        )}

        {litter && (
          <div className="mt-3 rounded-2xl bg-mint-subtle p-3 border border-soft-mint">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">cradle</span>
                <span className="font-semibold text-secondary">
                  Litter: {litter.totalAlive}/{litter.totalBorn} hidup • Lahir {formatDateID(litter.birthDate)}
                </span>
              </div>
              <Link href={`/breeding/litter/${litter.id}`}>
                <Button size="sm" variant="outline" className="h-8 rounded-full">Lihat Anak</Button>
              </Link>
            </div>
          </div>
        )}

        {mating.notes && (
          <p className="mt-2 rounded-2xl bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
            {mating.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface MatingFormProps {
  onClose: () => void;
}

function MatingForm({ onClose }: MatingFormProps) {
  const [queenType, setQueenType] = useState<"own" | "external">("own");
  const [queenId, setQueenId] = useState("");
  const [queenNameManual, setQueenNameManual] = useState("");
  const [sireType, setSireType] = useState<"own" | "external">("own");
  const [sireId, setSireId] = useState("");
  const [sireNameManual, setSireNameManual] = useState("");
  const [matingDate, setMatingDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock cats for selection (female for queen, male for sire)
  const { mockCats } = require("@/lib/mock");
  const females = mockCats.filter((c: any) => c.sex === "female" && c.status === "active" && c.trackingStatus === "tracked");
  const males = mockCats.filter((c: any) => c.sex === "male" && c.status === "active" && c.trackingStatus === "tracked");

  function todayStr() {
    const t = new Date();
    return t.toISOString().slice(0, 10);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (queenType === "own" && !queenId) nextErrors.queenId = "Pilih betina";
    if (queenType === "external" && !queenNameManual.trim()) nextErrors.queenNameManual = "Nama betina wajib diisi";
    if (sireType === "own" && !sireId) nextErrors.sireId = "Pilih pejantan";
    if (sireType === "external" && !sireNameManual.trim()) nextErrors.sireNameManual = "Nama pejantan wajib diisi";
    if (!matingDate) nextErrors.matingDate = "Tanggal kawin wajib diisi";
    if (matingDate > todayStr()) nextErrors.matingDate = "Tanggal tidak boleh di masa depan";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    // TODO: POST /api/matings
    onClose();
  }

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">Catat Kawin Baru</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Betina */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface">Betina *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setQueenType("own")}
                className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${queenType === "own" ? "border-primary bg-tangerine-subtle text-primary" : "border-sand-border bg-surface-card text-on-surface"}`}
              >
                Kucing Saya
              </button>
              <button
                type="button"
                onClick={() => setQueenType("external")}
                className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${queenType === "external" ? "border-primary bg-tangerine-subtle text-primary" : "border-sand-border bg-surface-card text-on-surface"}`}
              >
                Betina Luar
              </button>
            </div>
            {queenType === "own" ? (
              <select
                value={queenId}
                onChange={(e) => setQueenId(e.target.value)}
                className="w-full h-12 rounded-2xl border-sand-border px-4"
              >
                <option value="">Pilih betina</option>
                {females.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.breed})</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={queenNameManual}
                onChange={(e) => setQueenNameManual(e.target.value)}
                placeholder="Nama betina luar"
                className="w-full h-12 rounded-2xl border-sand-border px-4"
              />
            )}
            {(errors.queenId || errors.queenNameManual) && (
              <p className="text-sm text-error">{errors.queenId || errors.queenNameManual}</p>
            )}
          </div>

          {/* Pejantan */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface">Pejantan *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSireType("own")}
                className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${sireType === "own" ? "border-primary bg-tangerine-subtle text-primary" : "border-sand-border bg-surface-card text-on-surface"}`}
              >
                Kucing Saya
              </button>
              <button
                type="button"
                onClick={() => setSireType("external")}
                className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${sireType === "external" ? "border-primary bg-tangerine-subtle text-primary" : "border-sand-border bg-surface-card text-on-surface"}`}
              >
                Pejantan Luar
              </button>
            </div>
            {sireType === "own" ? (
              <select
                value={sireId}
                onChange={(e) => setSireId(e.target.value)}
                className="w-full h-12 rounded-2xl border-sand-border px-4"
              >
                <option value="">Pilih pejantan</option>
                {males.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.breed})</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={sireNameManual}
                onChange={(e) => setSireNameManual(e.target.value)}
                placeholder="Nama pejantan luar"
                className="w-full h-12 rounded-2xl border-sand-border px-4"
              />
            )}
            {(errors.sireId || errors.sireNameManual) && (
              <p className="text-sm text-error">{errors.sireId || errors.sireNameManual}</p>
            )}
          </div>

          {/* Tanggal kawin */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-on-surface">Tanggal Kawin *</label>
            <input
              type="date"
              value={matingDate}
              onChange={(e) => setMatingDate(e.target.value)}
              max={todayStr()}
              className="w-full h-12 rounded-2xl border-sand-border px-4"
            />
            {errors.matingDate && <p className="text-sm text-error">{errors.matingDate}</p>}
          </div>

          {/* Catatan */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-on-surface">Catatan</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border-sand-border px-4 py-3"
              placeholder="Detail kawin, dll."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 rounded-full">Batal</Button>
            <Button type="submit" className="flex-1 h-12 rounded-full">Simpan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}