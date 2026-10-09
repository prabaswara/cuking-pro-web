"use client";

import { useMemo, useState } from "react";
import { daysUntil, formatDateID, getCatName, mockReminders } from "@/lib/mock";

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

export function PengingatList() {
  const [filter, setFilter] = useState<string>("semua");
  const [doneIds, setDoneIds] = useState<Set<string>>(
    () => new Set(mockReminders.filter((r) => r.doneAt).map((r) => r.id))
  );

  const items = useMemo(() => {
    const withDone = mockReminders.map((r) => ({
      ...r,
      isDone: doneIds.has(r.id),
    }));
    if (filter === "selesai") return withDone.filter((r) => r.isDone);
    if (filter === "mendatang") return withDone.filter((r) => !r.isDone);
    return withDone;
  }, [filter, doneIds]);

  function toggleDone(id: string) {
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
                        {getCatName(r.catId)}
                      </span>
                      <span className="truncate text-sm text-text-muted">
                        • {r.title}
                      </span>
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
                <button
                  type="button"
                  onClick={() => toggleDone(r.id)}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
