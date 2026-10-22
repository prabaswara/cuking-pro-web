"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { daysUntil, formatDateID } from "@/lib/date";
import type { TimelineCategory, TimelineEvent } from "@/types";

const FILTERS: { value: TimelineCategory | "all"; label: string }[] = [
  { value: "all", label: "Semua Event" },
  { value: "medical", label: "Medis & Vaksin" },
  { value: "weight", label: "Berat Badan" },
  { value: "feeding", label: "Pakan" },
  { value: "breeding", label: "Breeding" },
  { value: "note", label: "Catatan Harian" },
];

const CATEGORY_ICON: Record<TimelineCategory, string> = {
  medical: "medical_services",
  weight: "scale",
  feeding: "restaurant",
  breeding: "favorite",
  note: "sticky_note_2",
};

const CATEGORY_STYLE: Record<TimelineCategory, string> = {
  medical: "bg-lavender-subtle text-tertiary",
  weight: "bg-tangerine-subtle text-primary",
  feeding: "bg-amber-subtle text-honey-amber",
  breeding: "bg-tangerine-subtle text-primary-container",
  note: "bg-mint-subtle text-secondary",
};

const CATEGORY_PILL: Record<TimelineCategory, string> = {
  medical: "bg-lavender-subtle text-tertiary",
  weight: "bg-tangerine-subtle text-primary",
  feeding: "bg-amber-subtle text-on-surface",
  breeding: "bg-tangerine-subtle text-primary",
  note: "bg-mint-subtle text-secondary",
};

const CATEGORY_LABEL: Record<TimelineCategory, string> = {
  medical: "Medis",
  weight: "Berat",
  feeding: "Pakan",
  breeding: "Breeding",
  note: "Catatan",
};

interface TimelineListProps {
  catId: string;
  catName: string;
  initialEvents: TimelineEvent[];
  lockedCount: number;
  windowStart: string | null;
}

export function TimelineList({
  catId,
  catName,
  initialEvents,
  lockedCount,
  windowStart,
}: TimelineListProps) {
  const [filter, setFilter] = useState<TimelineCategory | "all">("all");
  const [limit, setLimit] = useState(6);

  const events = initialEvents;
  const visible =
    filter === "all" ? events : events.filter((e) => e.category === filter);
  const shown = visible.slice(0, limit);

  return (
    <div className="space-y-5">
      {lockedCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-lavender-subtle p-3 text-sm text-tertiary">
          <span>
            <strong>{lockedCount} catatan terkunci</strong>
            {windowStart ? ` — riwayat sebelum ${windowStart} hanya untuk Pro.` : "."}
          </span>
          <Link href="/paket" className="shrink-0 font-semibold underline">
            Upgrade
          </Link>
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-2xl">
              history_edu
            </span>
            <h3 className="text-base font-bold text-on-surface">Riwayat &amp; Log</h3>
          </div>
          <Link href={`/kucing/${catId}/kesehatan/tambah`}>
            <Button type="button" className="h-10 rounded-full px-4">
              <span className="material-symbols-outlined mr-1 text-xl">add_circle</span>
              Tambah Catatan
            </Button>
          </Link>
        </div>

        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 py-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setFilter(f.value);
                setLimit(6);
              }}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                filter === f.value
                  ? "bg-primary-fixed text-on-primary-fixed shadow-xs"
                  : "bg-surface-container-lowest text-text-muted hover:text-on-surface"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* Feed */}
      {shown.length > 0 ? (
        <section className="relative w-full">
          <div className="absolute left-5 top-5 bottom-8 w-[2px] -translate-x-1/2 border-l-2 border-dashed border-outline-variant/60" />
          <div className="space-y-4">
            {shown.map((event) => (
              <TimelineItem key={event.id} event={event} />
            ))}
          </div>

          {visible.length > shown.length && (
            <div className="mt-8 flex flex-col items-center justify-center gap-2 pb-2 text-center">
              <button
                type="button"
                onClick={() => setLimit((l) => l + 6)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-surface-container-low text-primary shadow-xs transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-2xl">pets</span>
              </button>
              <p className="text-sm font-bold text-text-muted">
                Memuat riwayat lebih awal...
              </p>
              <span className="text-sm text-outline">
                Menampilkan {shown.length} dari {visible.length} total catatan
              </span>
            </div>
          )}
        </section>
      ) : (
        <div className="flex flex-col items-center rounded-3xl border border-sand-border bg-surface-card p-10 text-center shadow-warm-sm">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
            <span className="material-symbols-outlined text-3xl text-text-muted">
              history
            </span>
          </div>
          <h4 className="font-bold text-on-surface">Belum Ada Riwayat</h4>
          <p className="mt-1 max-w-xs text-sm text-text-muted">
            Belum ada catatan pada kategori ini untuk {catName}. Catat kegiatan
            harian, medis, atau breeding untuk mengisi linimasa.
          </p>
          <Link href={`/kucing/${catId}/kesehatan/tambah`}>
            <Button type="button" className="mt-4 h-10 rounded-full px-4">
              <span className="material-symbols-outlined mr-1 text-xl">add</span>
              Tambah Catatan
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const label = dateLabel(event.eventDate);

  return (
    <article className="relative flex items-start gap-3.5">
      <div
        className={`z-10 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ${CATEGORY_STYLE[event.category]}`}
      >
        <span
          className="material-symbols-outlined text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {CATEGORY_ICON[event.category]}
        </span>
      </div>
      <div className="flex-1 rounded-2xl border border-sand-border bg-surface-container-lowest p-3.5 shadow-warm-sm">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${CATEGORY_PILL[event.category]}`}
          >
            {CATEGORY_LABEL[event.category]}
          </span>
          <span className="flex items-center gap-1 text-sm text-text-muted">
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            {label}
            {event.eventTime ? `, ${event.eventTime}` : ""}
          </span>
        </div>
        <p className="text-base font-bold text-on-surface">{event.title}</p>
        {event.description && (
          <p className="mt-1 text-sm text-on-surface-variant">
            {event.description}
          </p>
        )}
        {event.meta && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {event.meta.delta && (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2 py-0.5 text-xs font-semibold text-secondary">
                <span className="material-symbols-outlined text-sm">
                  arrow_upward
                </span>
                {event.meta.delta}
              </span>
            )}
            {event.meta.status && (
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2 py-0.5 text-xs font-semibold text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-soft-mint">
                  check_circle
                </span>
                {event.meta.status}
              </span>
            )}
            {event.meta.petugas && (
              <span className="text-sm text-text-muted">
                Petugas: {event.meta.petugas}
              </span>
            )}
            {event.meta.partner && (
              <span className="w-full rounded-xl bg-surface-container-low p-2 text-xs font-semibold text-on-surface">
                {event.meta.partner}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function dateLabel(dateStr: string): string {
  const diff = daysUntil(dateStr);
  if (diff === 0) return "Hari Ini";
  if (diff === -1) return "Kemarin";
  if (diff === 1) return "Besok";
  return formatDateID(dateStr);
}
