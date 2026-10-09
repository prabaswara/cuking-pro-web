"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateID, getHeatCyclesForCat, daysBetween } from "@/lib/mock";

interface HeatCycleListProps {
  catId: string;
  catName: string;
}

export function HeatCycleList({ catId, catName }: HeatCycleListProps) {
  const [open, setOpen] = useState(false);
  const cycles = getHeatCyclesForCat(catId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Siklus Birahi</h3>
          <p className="text-sm text-text-muted">Riwayat birahi {catName}</p>
        </div>
        <Button
          onClick={() => setOpen(true)}
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
            <Button onClick={() => setOpen(true)} className="mt-4 h-10 rounded-full px-4">
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
                    {gap != null && (
                      <span className="rounded-full bg-amber-subtle px-3 py-1 text-sm font-semibold text-honey-amber">
                        {gap} hari dari siklus sblm
                      </span>
                    )}
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

      {/* Modal catat birahi */}
      {open && (
        <HeatCycleForm catId={catId} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

interface HeatCycleFormProps {
  catId: string;
  onClose: () => void;
}

function HeatCycleForm({ catId, onClose }: HeatCycleFormProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
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
    // TODO: POST /api/cats/:id/heat-cycles
    onClose();
  }

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">Catat Birahi Baru</h3>
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