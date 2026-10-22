"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeightChart } from "@/components/berat/weight-chart";
import { formatDateID } from "@/lib/date";
import type { WeightEntry } from "@/lib/health";

interface BeratContentProps {
  catId: string;
  catName: string;
  initialWeights: WeightEntry[];
  lockedCount: number;
  windowStart: string | null;
  frozen: boolean;
}

function readApiError(data: unknown): { message: string; field?: string } {
  const error = (data as { error?: { message?: string; field?: string } })?.error;
  return {
    message: error?.message ?? "Terjadi kesalahan. Silakan coba lagi.",
    field: error?.field,
  };
}

export function BeratContent({
  catId,
  catName,
  initialWeights,
  lockedCount,
  windowStart,
  frozen,
}: BeratContentProps) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editKg, setEditKg] = useState("");
  const [editNote, setEditNote] = useState("");
  const [newKg, setNewKg] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newNote, setNewNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [weights, setWeights] = useState<WeightEntry[]>(() =>
    [...initialWeights].sort((a, b) => b.date.localeCompare(a.date)),
  );
  const latest = weights[0];

  async function handleCreate() {
    const kg = Number(newKg);
    if (!newKg || !Number.isFinite(kg) || kg <= 0 || kg > 20) {
      setError("Berat harus lebih dari 0 dan maksimal 20 kg.");
      return;
    }
    if (!newDate) {
      setError("Tanggal timbang wajib diisi.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/cats/${catId}/weights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg: kg,
          recordDate: newDate,
          notes: newNote.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data).message);
        return;
      }

      const weight = (data as { weight: WeightEntry }).weight;
      setWeights((prev) =>
        [...prev, weight].sort((a, b) => b.date.localeCompare(a.date)),
      );
      setSaved(true);
      setNewKg("");
      setNewNote("");
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editing) return;
    const kg = Number(editKg);
    if (!Number.isFinite(kg) || kg <= 0 || kg > 20) {
      setError("Berat harus lebih dari 0 dan maksimal 20 kg.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/weights/${editing}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: kg, notes: editNote.trim() || null }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data).message);
        return;
      }

      const weight = (data as { weight: WeightEntry }).weight;
      setWeights((prev) => prev.map((w) => (w.id === weight.id ? weight : w)));
      setEditing(null);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/weights/${deleting}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(readApiError(data).message);
        return;
      }

      setWeights((prev) => prev.filter((w) => w.id !== deleting));
      setDeleting(null);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {frozen && (
        <p className="rounded-2xl bg-amber-subtle p-3 text-sm text-on-surface">
          Kucing ini dibekukan karena batas paket Free. Data berat hanya-baca.{" "}
          <Link href="/paket" className="font-semibold text-primary underline">
            Upgrade ke Pro
          </Link>
        </p>
      )}

      {lockedCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-lavender-subtle p-3 text-sm text-tertiary">
          <span>
            <strong>{lockedCount} data terkunci</strong>
            {windowStart ? ` — riwayat sebelum ${windowStart} hanya untuk Pro.` : "."}
          </span>
          <Link href="/paket" className="shrink-0 font-semibold underline">
            Upgrade
          </Link>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-error-container p-3 text-sm text-error">{error}</p>
      )}

      {/* Ringkasan */}
      {latest ? (
        <div className="rounded-3xl border border-sand-border bg-surface-card p-4 shadow-warm-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Berat Badan Saat Ini
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-on-surface">
              {latest.kg.toFixed(1)}
            </span>
            <span className="font-bold text-on-surface-variant">kg</span>
          </div>
          <p className="mt-0.5 text-sm text-text-muted">
            Ditimbang: {formatDateID(latest.date)}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-sand-border bg-surface-card p-6 text-center shadow-warm-sm">
          <p className="font-semibold text-on-surface">Belum ada data berat</p>
          <p className="mt-1 text-sm text-text-muted">
            Tambah 1 data lagi untuk melihat grafik (minimal 2 data).
          </p>
        </div>
      )}

      {/* Grafik */}
      <div className="rounded-3xl border border-sand-border bg-surface-card p-4 shadow-warm-sm">
        <h3 className="font-bold text-on-surface">Grafik Pertumbuhan</h3>
        <p className="text-sm text-text-muted">Tren penambahan berat badan</p>
        <div className="mt-2">
          <WeightChart weights={weights} />
        </div>
      </div>

      {/* CTA */}
      {!frozen && (
        <Button
          type="button"
          onClick={() => {
            setOpen(true);
            setSaved(false);
            setError(null);
          }}
          className="h-12 w-full rounded-full text-base font-semibold"
        >
          <span className="material-symbols-outlined mr-2 text-xl">scale</span>+ Catat Berat Badan
        </Button>
      )}

      {/* Riwayat */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">Riwayat Timbang Badan</h3>
          <span className="text-sm text-text-muted">
            {weights.length} Catatan Tersimpan
          </span>
        </div>
        {weights.map((w, i) => {
          const prev = weights[i + 1];
          const diff = prev ? w.kg - prev.kg : null;
          return (
            <div
              key={w.id}
              className="rounded-3xl border border-sand-border bg-surface-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tangerine-subtle text-primary">
                    <span className="material-symbols-outlined text-lg">
                      monitor_weight
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">
                      {w.kg.toFixed(1)} kg
                    </p>
                    <p className="text-sm text-text-muted">
                      {formatDateID(w.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!frozen && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(w.id);
                          setEditKg(w.kg.toString());
                          setEditNote(w.note ?? "");
                          setError(null);
                        }}
                        aria-label="Edit"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-container hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleting(w.id);
                          setError(null);
                        }}
                        aria-label="Hapus"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-error-container hover:text-error"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </>
                  )}
                  {diff != null ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        diff >= 0
                          ? "bg-mint-subtle text-secondary"
                          : "bg-amber-subtle text-honey-amber"
                      }`}
                    >
                      {diff >= 0 ? "+" : ""}
                      {(diff * 1000).toFixed(0)}g
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs text-text-muted">
                      Baseline
                    </span>
                  )}
                </div>
              </div>
              {w.note && (
                <p className="mt-2 rounded-2xl bg-surface-container-low px-3 py-1.5 text-sm text-on-surface-variant">
                  <strong className="text-on-surface">Catatan:</strong> {w.note}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal catat cepat */}
      {open && (
        <>
          {/* Backdrop di bawah BottomNav (z-50) */}
          <div
            className="fixed inset-0 z-45 bg-inverse-surface/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Konten modal di atas BottomNav */}
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 pb-28 pointer-events-none">
            <div className="pointer-events-auto max-h-[80dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-on-surface">
                  Catat Berat {catName}
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              {saved ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-mint-subtle p-4 text-center">
                    <p className="font-semibold text-secondary">
                      Berat tersimpan! 🎉
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSaved(false)}
                    className="h-12 w-full rounded-full"
                  >
                    Catat Lagi
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-12 w-full rounded-full"
                  >
                    Selesai
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="quick-weight">Berat (kg)</Label>
                    <Input
                      id="quick-weight"
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="20"
                      value={newKg}
                      onChange={(e) => setNewKg(e.target.value)}
                      placeholder={latest ? latest.kg.toFixed(2) : "4.00"}
                      className="h-12 rounded-2xl border-sand-border"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quick-date">Tanggal Timbang</Label>
                    <Input
                      id="quick-date"
                      type="date"
                      value={newDate}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="h-12 rounded-2xl border-sand-border"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quick-note">Catatan (opsional)</Label>
                    <Input
                      id="quick-note"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="cth: setelah vaksin, nafsu makan naik"
                      className="h-12 rounded-2xl border-sand-border"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={isSaving}
                      className="h-12 flex-1 rounded-full"
                    >
                      Batal
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreate}
                      disabled={isSaving}
                      className="h-12 flex-1 rounded-full"
                    >
                      {isSaving ? "Menyimpan..." : "Simpan Data"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal edit berat */}
      {editing && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-on-surface">Edit Berat Badan</h3>
              <button onClick={() => setEditing(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit-kg">Berat (kg)</Label>
                <Input
                  id="edit-kg"
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="20"
                  value={editKg}
                  onChange={(e) => setEditKg(e.target.value)}
                  className="h-12 rounded-2xl border-sand-border"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-note">Catatan</Label>
                <Input
                  id="edit-note"
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="cth: stabil, aktif"
                  className="h-12 rounded-2xl border-sand-border"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={isSaving} className="h-12 flex-1 rounded-full">Batal</Button>
                <Button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="h-12 flex-1 rounded-full"
                >
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog hapus berat */}
      {deleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
            <h3 className="font-bold text-on-surface">Hapus Catatan Berat?</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Catatan timbang badan ini akan dihapus permanen.
            </p>
            <div className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleting(null)} disabled={isSaving} className="h-12 flex-1 rounded-full">Batal</Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="h-12 flex-1 rounded-full bg-error text-white hover:bg-error/90"
              >
                {isSaving ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
