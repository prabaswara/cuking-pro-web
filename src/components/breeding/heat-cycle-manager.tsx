"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDateID, daysBetweenIso, todayIso } from "@/lib/date";
import type { HeatCycleWithCat } from "@/lib/heat-cycles";
import type { BreedingCatOption } from "@/components/breeding/breeding-tabs";

type HeatCycleItem = HeatCycleWithCat;

function readApiError(data: unknown): string {
  return (
    (data as { error?: { message?: string } })?.error?.message ??
    "Terjadi kesalahan. Silakan coba lagi."
  );
}

function sortCycles(items: HeatCycleItem[]): HeatCycleItem[] {
  const ascending = [...items].sort((a, b) => {
    const byCat = a.catId.localeCompare(b.catId);
    return byCat !== 0 ? byCat : a.startDate.localeCompare(b.startDate);
  });

  const previous = new Map<string, string>();
  const gapById = new Map<string, number>();

  for (const item of ascending) {
    const last = previous.get(item.catId);
    if (last) gapById.set(item.id, daysBetweenIso(last, item.startDate));
    previous.set(item.catId, item.startDate);
  }

  return [...items]
    .map((item) => ({ ...item, gapDays: gapById.get(item.id) ?? null }))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export function HeatCycleManager({
  initial,
  females,
}: {
  initial: {
    items: HeatCycleItem[];
    lockedCount: number;
    windowStart: string | null;
  };
  females: BreedingCatOption[];
}) {
  const [cycles, setCycles] = useState<HeatCycleItem[]>(() =>
    sortCycles(initial.items),
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HeatCycleItem | null>(null);
  const [deleting, setDeleting] = useState<HeatCycleItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const femaleOptions = useMemo(
    () => females.map((cat) => ({ id: cat.id, name: cat.name })),
    [females],
  );

  function openCreate() {
    setEditing(null);
    setError(null);
    setOpen(true);
  }

  function openEdit(item: HeatCycleItem) {
    setEditing(item);
    setError(null);
    setOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/heat-cycles/${deleting.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(readApiError(data));
        return;
      }

      setCycles((prev) => sortCycles(prev.filter((c) => c.id !== deleting.id)));
      setDeleting(null);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Siklus Birahi</h3>
          <p className="text-sm text-text-muted">
            Riwayat birahi seluruh betina yang dilacak
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          disabled={femaleOptions.length === 0}
          className="h-10 rounded-full px-4"
        >
          <span className="material-symbols-outlined mr-1 text-xl">add</span>
          Catat Birahi
        </Button>
      </div>

      {error && !open && !deleting && (
        <p className="rounded-xl bg-error-container p-3 text-sm text-error">
          {error}
        </p>
      )}

      {initial.lockedCount > 0 && initial.windowStart && (
        <p className="rounded-2xl border border-amber-subtle bg-amber-subtle/40 p-3 text-sm text-honey-amber">
          {initial.lockedCount} siklus lebih lama dari{" "}
          {formatDateID(initial.windowStart)} terkunci di paket Free.
        </p>
      )}

      {femaleOptions.length === 0 ? (
        <EmptyState
          title="Belum Ada Betina Dilacak"
          description="Tambahkan kucing betina aktif dan dilacak untuk mencatat siklus birahi."
        />
      ) : cycles.length === 0 ? (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-3xl text-text-muted">
                event_repeat
              </span>
            </div>
            <h4 className="font-bold text-on-surface">Belum Ada Siklus Birahi</h4>
            <p className="mt-1 max-w-xs text-sm text-text-muted">
              Catat siklus birahi pertama untuk memulai pemantauan.
            </p>
            <Button onClick={openCreate} className="mt-4 h-10 rounded-full px-4">
              Catat Birahi Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cycles.map((cycle) => {
            const duration = cycle.endDate
              ? daysBetweenIso(cycle.startDate, cycle.endDate) + 1
              : null;

            return (
              <Card
                key={cycle.id}
                className="rounded-3xl border-sand-border shadow-warm-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lavender-subtle text-tertiary">
                        <span className="material-symbols-outlined text-xl">
                          event_repeat
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-on-surface">
                          {cycle.catName}
                        </p>
                        <p className="text-sm text-on-surface-variant">
                          {formatDateID(cycle.startDate)} –{" "}
                          {cycle.endDate
                            ? formatDateID(cycle.endDate)
                            : "Berlangsung"}
                        </p>
                        <p className="text-sm text-text-muted">
                          {duration != null
                            ? `${duration} hari`
                            : "Belum selesai"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(cycle)}
                        aria-label="Edit"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-container hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-lg">
                          edit
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(cycle)}
                        aria-label="Hapus"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-error-container hover:text-error"
                      >
                        <span className="material-symbols-outlined text-lg">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {cycle.gapDays != null && (
                      <span className="rounded-full bg-amber-subtle px-2.5 py-1 text-xs font-semibold text-honey-amber">
                        Jarak dari siklus sebelumnya: {cycle.gapDays} hari
                      </span>
                    )}
                    {cycle.endDate === null && (
                      <span className="rounded-full bg-lavender-subtle px-2.5 py-1 text-xs font-semibold text-tertiary">
                        Berlangsung
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

      {open && (
        <HeatCycleForm
          initial={editing}
          females={femaleOptions}
          saving={saving}
          error={error}
          onClose={() => {
            setOpen(false);
            setEditing(null);
            setError(null);
          }}
          onSubmit={async (payload) => {
            setSaving(true);
            setError(null);

            try {
              const response = await fetch(
                editing
                  ? `/api/heat-cycles/${editing.id}`
                  : `/api/cats/${payload.catId}/heat-cycles`,
                {
                  method: editing ? "PATCH" : "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    startDate: payload.startDate,
                    endDate: payload.endDate,
                    notes: payload.notes,
                  }),
                },
              );

              const data = await response.json().catch(() => null);

              if (!response.ok) {
                setError(readApiError(data));
                return;
              }

              const saved = (data as { cycle: HeatCycleWithCat }).cycle;
              const catName =
                editing?.catName ??
                femaleOptions.find((cat) => cat.id === payload.catId)?.name ??
                "Kucing";

              setCycles((prev) =>
                sortCycles(
                  editing
                    ? prev.map((cycle) =>
                        cycle.id === editing.id
                          ? { ...cycle, ...saved, catName }
                          : cycle,
                      )
                    : [...prev, { ...saved, catName, gapDays: null }],
                ),
              );

              setOpen(false);
              setEditing(null);
            } catch {
              setError("Terjadi kesalahan. Silakan coba lagi.");
            } finally {
              setSaving(false);
            }
          }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
            <h3 className="font-bold text-on-surface">Hapus Siklus Birahi?</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Siklus {deleting.catName} mulai {formatDateID(deleting.startDate)}{" "}
              akan dihapus permanen.
            </p>
            {error && (
              <p className="mt-3 rounded-xl bg-error-container p-3 text-sm text-error">
                {error}
              </p>
            )}
            <div className="mt-6 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleting(null);
                  setError(null);
                }}
                disabled={saving}
                className="h-12 flex-1 rounded-full"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="h-12 flex-1 rounded-full bg-error text-white hover:bg-error/90"
              >
                {saving ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardContent className="flex flex-col items-center p-10 text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
          <span className="material-symbols-outlined text-3xl text-text-muted">
            pets
          </span>
        </div>
        <h4 className="font-bold text-on-surface">{title}</h4>
        <p className="mt-1 max-w-xs text-sm text-text-muted">{description}</p>
      </CardContent>
    </Card>
  );
}

function HeatCycleForm({
  initial,
  females,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  initial: HeatCycleItem | null;
  females: { id: string; name: string }[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    catId: string;
    startDate: string;
    endDate: string | null;
    notes: string | null;
  }) => void;
}) {
  const [catId, setCatId] = useState(initial?.catId ?? females[0]?.id ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!catId) nextErrors.catId = "Pilih betina";
    if (!startDate) nextErrors.startDate = "Tanggal mulai wajib diisi";
    if (startDate && startDate > todayIso()) {
      nextErrors.startDate = "Tanggal tidak boleh di masa depan";
    }
    if (endDate && endDate > todayIso()) {
      nextErrors.endDate = "Tanggal tidak boleh di masa depan";
    }
    if (endDate && startDate && endDate < startDate) {
      nextErrors.endDate = "Tanggal selesai tidak boleh sebelum mulai";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      catId,
      startDate,
      endDate: endDate || null,
      notes: notes.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">
            {initial ? "Edit Siklus Birahi" : "Catat Birahi Baru"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {error && (
          <p className="rounded-xl bg-error-container p-3 text-sm text-error">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <Label htmlFor="heat-cat">Betina *</Label>
          <select
            id="heat-cat"
            value={catId}
            onChange={(event) => setCatId(event.target.value)}
            disabled={Boolean(initial)}
            className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-on-surface disabled:opacity-60"
          >
            <option value="">Pilih betina</option>
            {females.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.catId && <p className="text-sm text-error">{errors.catId}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="heat-start">Tanggal Mulai *</Label>
          <Input
            id="heat-start"
            type="date"
            value={startDate}
            max={todayIso()}
            onChange={(event) => setStartDate(event.target.value)}
            className="h-12 rounded-2xl border-sand-border"
          />
          {errors.startDate && (
            <p className="text-sm text-error">{errors.startDate}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="heat-end">Tanggal Selesai (opsional)</Label>
          <Input
            id="heat-end"
            type="date"
            value={endDate}
            max={todayIso()}
            onChange={(event) => setEndDate(event.target.value)}
            className="h-12 rounded-2xl border-sand-border"
          />
          {errors.endDate && (
            <p className="text-sm text-error">{errors.endDate}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="heat-notes">Catatan</Label>
          <Textarea
            id="heat-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Gejala, perilaku, dll."
            className="rounded-2xl border-sand-border"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="h-12 flex-1 rounded-full"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="h-12 flex-1 rounded-full"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
