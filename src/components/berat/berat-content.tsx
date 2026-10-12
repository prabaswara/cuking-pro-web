"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeightChart } from "@/components/berat/weight-chart";
import { formatDateID, getCatName, mockWeights } from "@/lib/mock";

export function BeratContent({ catId }: { catId: string }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editKg, setEditKg] = useState("");
  const [editNote, setEditNote] = useState("");
  const catName = getCatName(catId);

  const [weights, setWeights] = useState(() =>
    mockWeights
      .filter((w) => w.catId === catId)
      .sort((a, b) => b.date.localeCompare(a.date))
  );
  const latest = weights[0];

  return (
    <div className="space-y-4">
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
          <WeightChart catId={catId} />
        </div>
      </div>

      {/* CTA */}
      <Button
        type="button"
        onClick={() => {
          setOpen(true);
          setSaved(false);
        }}
        className="h-12 w-full rounded-full text-base font-semibold"
      >
        <span className="material-symbols-outlined mr-2 text-xl">scale</span>+ Catat Berat Badan
      </Button>

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
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(w.id);
                      setEditKg(w.kg.toString());
                      setEditNote(w.note ?? "");
                    }}
                    aria-label="Edit"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-container hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(w.id)}
                    aria-label="Hapus"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-error-container hover:text-error"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
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
                <div className="rounded-2xl bg-mint-subtle p-4 text-center">
                  <p className="font-semibold text-secondary">
                    Berat tersimpan! 🎉
                  </p>
                  <p className="text-sm text-secondary/80">
                    (Demo — hubungkan ke API saat backend siap)
                  </p>
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
                      defaultValue={latest ? latest.kg.toFixed(2) : "4.00"}
                      className="h-12 rounded-2xl border-sand-border"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quick-date">Tanggal Timbang</Label>
                    <Input
                      id="quick-date"
                      type="date"
                      className="h-12 rounded-2xl border-sand-border"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      className="h-12 flex-1 rounded-full"
                    >
                      Batal
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setSaved(true)}
                      className="h-12 flex-1 rounded-full"
                    >
                      Simpan Data
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
                <Button type="button" variant="outline" onClick={() => setEditing(null)} className="h-12 flex-1 rounded-full">Batal</Button>
                <Button
                  type="button"
                  onClick={() => {
                    const kg = parseFloat(editKg);
                    if (kg > 0 && kg <= 20) {
                      setWeights((prev) =>
                        prev.map((w) => (w.id === editing ? { ...w, kg, note: editNote.trim() || undefined } : w))
                      );
                      setEditing(null);
                    }
                  }}
                  className="h-12 flex-1 rounded-full"
                >
                  Simpan
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
              <Button type="button" variant="outline" onClick={() => setDeleting(null)} className="h-12 flex-1 rounded-full">Batal</Button>
              <Button
                type="button"
                onClick={() => {
                  setWeights((prev) => prev.filter((w) => w.id !== deleting));
                  setDeleting(null);
                }}
                className="h-12 flex-1 rounded-full bg-error text-white hover:bg-error/90"
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
