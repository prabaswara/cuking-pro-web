"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { daysUntil, formatDateID } from "@/lib/date";
import type { Reminder } from "@/types";

type ReminderItem = Reminder & {
  catName: string | null;
  catTrackingStatus: "tracked" | "frozen" | null;
};

type CatOption = { id: string; name: string; frozen: boolean };

const FILTERS = [
  { value: "semua", label: "Semua" },
  { value: "mendatang", label: "Mendatang" },
  { value: "selesai", label: "Selesai" },
] as const;

const ACCENT: Record<string, string> = {
  health: "bg-error",
  pregnancy: "bg-tertiary",
  booking_planned: "bg-honey-amber",
  booking_due: "bg-tertiary",
  manual: "bg-honey-amber",
};

const ICON: Record<string, { bg: string; text: string; icon: string }> = {
  health: { bg: "bg-error-container", text: "text-error", icon: "vaccines" },
  pregnancy: { bg: "bg-lavender-subtle", text: "text-tertiary", icon: "pregnant_woman" },
  booking_planned: { bg: "bg-amber-subtle", text: "text-honey-amber", icon: "event" },
  booking_due: { bg: "bg-lavender-subtle", text: "text-tertiary", icon: "event" },
  manual: { bg: "bg-amber-subtle", text: "text-honey-amber", icon: "notifications" },
};

function readApiError(data: unknown): string {
  return (
    (data as { error?: { message?: string } })?.error?.message ??
    "Terjadi kesalahan. Silakan coba lagi."
  );
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PengingatList({
  initialReminders,
  cats,
}: {
  initialReminders: ReminderItem[];
  cats: CatOption[];
}) {
  const [filter, setFilter] = useState<string>("semua");
  const [reminders, setReminders] = useState<ReminderItem[]>(initialReminders);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState(todayStr);
  const [newCatId, setNewCatId] = useState("");

  const items = useMemo(() => {
    const withDone = reminders.map((r) => ({ ...r, isDone: Boolean(r.doneAt) }));
    if (filter === "selesai") return withDone.filter((r) => r.isDone);
    if (filter === "mendatang") return withDone.filter((r) => !r.isDone);
    return withDone;
  }, [filter, reminders]);

  async function toggleDone(id: string, isDone: boolean) {
    setError(null);

    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !isDone }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return;
      }

      const updated = (data as { reminder: Reminder }).reminder;
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, doneAt: updated.doneAt } : r)),
      );
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    }
  }

  async function postpone(id: string) {
    setError(null);

    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postponeDays: 1 }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return;
      }

      const updated = (data as { reminder: Reminder }).reminder;
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, dueDate: updated.dueDate, doneAt: updated.doneAt }
            : r,
        ),
      );
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    }
  }

  async function handleDelete(id: string) {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(readApiError(data));
        return;
      }

      setReminders((prev) => prev.filter((r) => r.id !== id));
      setDeleting(null);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!newTitle.trim()) {
      setError("Judul pengingat wajib diisi.");
      return;
    }
    if (!newDueDate) {
      setError("Tanggal pengingat wajib diisi.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          dueDate: newDueDate,
          catId: newCatId || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return;
      }

      const created = (data as { reminder: Reminder }).reminder;
      const cat = cats.find((c) => c.id === created.catId);
      const nextItem: ReminderItem = {
        ...created,
        catName: cat?.name ?? null,
        catTrackingStatus: cat ? (cat.frozen ? "frozen" : "tracked") : null,
      };

      setReminders((prev) =>
        [...prev, nextItem].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      );

      setAddOpen(false);
      setNewTitle("");
      setNewDueDate(todayStr());
      setNewCatId("");
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  }

  function subtitle(dueDate: string): string {
    const d = daysUntil(dueDate);
    if (d < 0) return `Terlambat ${Math.abs(d)} hari (${formatDateID(dueDate)})`;
    if (d === 0) return `Hari ini (${formatDateID(dueDate)})`;
    if (d === 1) return `Besok (${formatDateID(dueDate)})`;
    return `${d} hari lagi (${formatDateID(dueDate)})`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                filter === f.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface-card text-text-muted shadow-sm"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button
          type="button"
          onClick={() => {
            setAddOpen(true);
            setError(null);
          }}
          className="h-10 shrink-0 rounded-full px-4"
        >
          <span className="material-symbols-outlined mr-1 text-xl">add</span>
          Tambah
        </Button>
      </div>

      {error && (
        <p className="rounded-xl bg-error-container p-3 text-sm text-error">{error}</p>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-sand-border bg-surface-card p-10 text-center shadow-warm-sm">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
            <span className="material-symbols-outlined text-3xl text-text-muted">
              event_available
            </span>
          </div>
          <h4 className="font-bold text-on-surface">Tidak ada pengingat</h4>
          <p className="mt-1 max-w-xs text-sm text-text-muted">
            Semua jadwal sudah terpenuhi di kategori ini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((r) => {
            const icon = ICON[r.sourceType] ?? ICON.manual;
            const overdue = !r.isDone && daysUntil(r.dueDate) < 0;
            return (
              <div
                key={r.id}
                className="relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-sand-border bg-surface-card p-3.5 shadow-warm-sm"
              >
                <div
                  className={`absolute bottom-0 left-0 top-0 w-1.5 ${r.isDone ? "bg-soft-mint" : (ACCENT[r.sourceType] ?? ACCENT.manual)}`}
                />
                <div className="flex min-w-0 items-center gap-3 pl-1">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${icon.bg} ${icon.text}`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {icon.icon}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-on-surface">
                        {r.catName ?? "Umum"}
                      </span>
                      <span className="truncate text-sm text-text-muted">
                        • {r.title}
                      </span>
                      {r.catTrackingStatus === "frozen" && (
                        <span className="shrink-0 rounded-full bg-amber-subtle px-1.5 py-0.5 text-[10px] font-semibold text-honey-amber">
                          Beku
                        </span>
                      )}
                    </div>
                    <span
                      className={`truncate text-sm ${
                        r.isDone
                          ? "text-text-muted line-through"
                          : overdue
                            ? "font-semibold text-error"
                            : "text-text-muted"
                      }`}
                    >
                      {r.isDone ? "Selesai" : subtitle(r.dueDate)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!r.isDone && (
                    <button
                      type="button"
                      onClick={() => postpone(r.id)}
                      aria-label="Tunda 1 hari"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-container hover:text-on-surface active:scale-90"
                    >
                      <span className="material-symbols-outlined text-lg">snooze</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleting(r.id)}
                    aria-label="Hapus"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-error-container hover:text-error active:scale-90"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDone(r.id, r.isDone)}
                    aria-label={r.isDone ? "Tandai belum selesai" : "Tandai selesai"}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 ${
                      r.isDone
                        ? "bg-mint-subtle text-secondary"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {r.isDone ? "check_circle" : "done"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add manual reminder */}
      {addOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md space-y-4 rounded-3xl bg-surface-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-on-surface">Pengingat Manual</h3>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reminder-title">Judul *</Label>
              <Input
                id="reminder-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="cth: Timbang berat rutin"
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="reminder-date">Tanggal *</Label>
              <Input
                id="reminder-date"
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="reminder-cat">Kucing (opsional)</Label>
              <select
                id="reminder-cat"
                value={newCatId}
                onChange={(e) => setNewCatId(e.target.value)}
                className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-on-surface"
              >
                <option value="">Umum (tanpa kucing)</option>
                {cats.map((cat) => (
                  <option key={cat.id} value={cat.id} disabled={cat.frozen}>
                    {cat.name}
                    {cat.frozen ? " (dibekukan)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={isSaving}
                className="h-12 flex-1 rounded-full"
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className="h-12 flex-1 rounded-full">
                {isSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
            <h3 className="font-bold text-on-surface">Hapus Pengingat?</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Pengingat ini akan dihapus permanen.
            </p>
            <div className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleting(null)} disabled={isSaving} className="h-12 flex-1 rounded-full">
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => handleDelete(deleting)}
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
