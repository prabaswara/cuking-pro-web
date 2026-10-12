"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateID, getHeatCyclesForCat, daysBetween } from "@/lib/mock";
import type { HeatCycle } from "@/types";

interface HeatCycleListProps {
  catId: string;
  catName: string;
}

export function HeatCycleList({ catId, catName }: HeatCycleListProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HeatCycle | null>(null);
  const [deleting, setDeleting] = useState<HeatCycle | null>(null);
  const [cycles, setCycles] = useState(() => getHeatCyclesForCat(catId));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Siklus Birahi</h3>
          <p className="text-sm text-text-muted">Riwayat birahi {catName}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="h-10 rounded-full px-4"
        >
          <span className="material-symbols-outlined mr-1 text-xl">add</span>
          Catat Birahi
        </Button>
      </div>

      {cycles.length === 0 ? (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center rounded-3xl p-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-3xl text-text-muted">event_repeat</span>
            </div>
            <h4 className="font-bold text-on-surface">Belum Ada Siklus Birahi</h4>
            <p className="mt-1 max-w-xs text-sm text-text-muted">
              Catat siklus birahi pertama untuk memulai pemantauan.
            </p>
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="mt-4 h-10 rounded-full px-4"
            >
              Catat Birahi Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cycles.map((cycle, idx) => {
            const prev = cycles[idx + 1];
            const gap = prev ? daysBetween(prev.startDate, cycle.startDate) : null;
            return (
              <Card key={cycle.id} className="rounded-3xl border-sand-border shadow-warm-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lavender-subtle text-tertiary">
                        <span className="material-symbols-outlined text-xl">event_repeat</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-on-surface">
                            {formatDateID(cycle.startDate)} – {cycle.endDate ? formatDateID(cycle.endDate) : "Berlangsung"}
                          </p>
                        </div>
                        <p className="text-sm text-text-muted">
                          {cycle.endDate
                            ? `${daysBetween(cycle.startDate, cycle.endDate) + 1} hari`
                            : "Belum selesai"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(cycle);
                          setOpen(true);
                        }}
                        aria-label="Edit"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-container hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(cycle)}
                        aria-label="Hapus"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-error-container hover:text-error"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                      {gap != null && (
                        <span className="rounded-full bg-amber-subtle px-2.5 py-1 text-xs font-semibold text-honey-amber">
                          {gap} hari dari siklus sblm
                        </span>
                      )}
                    </div>
                  </div>
                  {cycle.notes && (
                    <p className="mt-2 rounded-2xl bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
                      {cycle.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {open && (
        <HeatCycleForm
          initial={editing}
          catId={catId}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSave={(data) => {
            if (editing) {
              setCycles((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...data } : c)));
            } else {
              setCycles((prev) => [
                ...prev,
                { id: `hc-${Date.now()}`, catId, ...data },
              ].sort((a, b) => b.startDate.localeCompare(a.startDate)));
            }
          }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
            <h3 className="font-bold text-on-surface">Hapus Siklus Birahi?</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Siklus birahi {formatDateID(deleting.startDate)} akan dihapus permanen.
            </p>
            <div className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleting(null)} className="h-12 flex-1 rounded-full">
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setCycles((prev) => prev.filter((c) => c.id !== deleting.id));
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

interface HeatCycleFormProps {
  initial: HeatCycle | null;
  catId: string;
  onClose: () => void;
  onSave: (data: { startDate: string; endDate: string; notes: string }) => void;
}

function HeatCycleForm({ initial, onClose, onSave }: HeatCycleFormProps) {
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function todayStr() {
    const t = new Date();
    return t.toISOString().slice(0, 10);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!startDate) nextErrors.startDate = "Tanggal mulai wajib diisi";
    if (startDate > todayStr()) nextErrors.startDate = "Tanggal tidak boleh di masa depan";
    if (endDate && endDate < startDate) nextErrors.endDate = "Tanggal selesai tidak boleh sebelum mulai";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    // TODO: POST /api/cats/:id/heat-cycles atau PATCH /api/heat-cycles/:id
    onSave({ startDate, endDate, notes });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">{initial ? "Edit Siklus Birahi" : "Catat Birahi Baru"}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-on-surface">Tanggal Mulai *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={todayStr()}
              className="w-full h-12 rounded-2xl border-sand-border px-4"
            />
            {errors.startDate && <p className="text-sm text-error">{errors.startDate}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-on-surface">Tanggal Selesai (opsional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={todayStr()}
              className="w-full h-12 rounded-2xl border-sand-border px-4"
            />
            {errors.endDate && <p className="text-sm text-error">{errors.endDate}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-on-surface">Catatan</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border-sand-border px-4 py-3"
              placeholder="Gejala, perilaku, dll."
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