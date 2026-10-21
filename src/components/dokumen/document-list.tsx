"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  documentCategoryLabel,
  getCatDocuments,
} from "@/lib/mock";
import type { CatDocument } from "@/types";

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "pedigree", label: "Pedigree" },
  { value: "vaccine_book", label: "Buku Vaksin" },
  { value: "lab", label: "Hasil Lab / USG" },
  { value: "registration", label: "Registrasi" },
] as const;

const CATEGORY_ICON: Record<CatDocument["category"], string> = {
  pedigree: "workspace_premium",
  vaccine_book: "vaccines",
  lab: "biotech",
  registration: "memory",
  other: "history_edu",
};

const CATEGORY_STYLE: Record<CatDocument["category"], string> = {
  pedigree: "bg-amber-subtle text-honey-amber",
  vaccine_book: "bg-amber-subtle text-honey-amber",
  lab: "bg-tertiary-fixed text-tertiary",
  registration: "bg-secondary-container/40 text-secondary",
  other: "bg-surface-container text-on-surface-variant",
};

interface DocumentListProps {
  catId: string;
  catName: string;
}

export function DocumentList({ catId, catName }: DocumentListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);

  const documents = useMemo(() => getCatDocuments(catId), [catId]);
  const visible =
    filter === "all"
      ? documents
      : documents.filter((doc) => doc.category === filter);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: documents.length };
    for (const doc of documents) {
      map[doc.category] = (map[doc.category] ?? 0) + 1;
    }
    return map;
  }, [documents]);

  return (
    <div className="space-y-5">
      {/* Brankas */}
      <section className="space-y-4 rounded-3xl border border-sand-border bg-surface-card p-5 shadow-warm-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-subtle text-honey-amber">
              <span className="material-symbols-outlined text-2xl">lock</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Brankas Anabul</h3>
              <p className="text-sm text-text-muted">
                Cloud terenkripsi &amp; sinkron otomatis
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-mint-subtle px-2.5 py-1 text-xs font-semibold text-secondary">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            CFA &amp; ICA Valid
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col justify-between rounded-2xl bg-surface-container-low p-3">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-semibold">Total Berkas</span>
              <span className="material-symbols-outlined text-base text-primary">
                description
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-on-surface">
              {documents.length}{" "}
              <span className="text-sm font-normal text-text-muted">Digital</span>
            </p>
          </div>
          <div className="flex flex-col justify-between rounded-2xl bg-surface-container-low p-3">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="text-xs font-semibold">Penyimpanan</span>
              <span className="material-symbols-outlined text-base text-secondary">
                cloud_done
              </span>
            </div>
            <p className="mt-1 text-xl font-bold text-on-surface">
              10.3 <span className="text-sm font-normal text-text-muted">MB terpakai</span>
            </p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="h-12 rounded-full"
        >
          <span className="material-symbols-outlined mr-2 text-xl">add_circle</span>
          Unggah Berkas
        </Button>
        <Button type="button" variant="outline" className="h-12 rounded-full">
          <span className="material-symbols-outlined mr-2 text-xl">archive</span>
          Unduh ZIP
        </Button>
      </div>

      {/* Filter */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-on-surface">Semua Berkas</h3>
          <span className="text-sm text-text-muted">
            {visible.length} Dokumen
          </span>
        </div>
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 py-0.5">
          {FILTERS.map((f) => {
            const count = f.value === "all" ? counts.all : counts[f.value] ?? 0;
            if (f.value !== "all" && count === 0) return null;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                  filter === f.value
                    ? "bg-on-surface text-surface-card shadow-sm"
                    : "bg-surface-card text-text-muted shadow-sm hover:text-on-surface"
                }`}
              >
                {f.label}
                {f.value === "all" ? ` (${count})` : ` (${count})`}
              </button>
            );
          })}
        </div>
      </section>

      {/* List */}
      {visible.length > 0 ? (
        <section className="space-y-2.5">
          {visible.map((doc) => (
            <article
              key={doc.id}
              className="flex items-center gap-3 rounded-2xl border border-sand-border bg-surface-card p-4 shadow-warm-sm transition-transform active:scale-[0.99]"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${CATEGORY_STYLE[doc.category]}`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {CATEGORY_ICON[doc.category]}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-on-surface">
                  {doc.title}
                </h4>
                <p className="mt-0.5 truncate text-sm text-text-muted">
                  {formatUploadedAt(doc.uploadedAt)} • {doc.sizeLabel}
                  {doc.source ? ` • ${doc.source}` : ""}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      doc.verified
                        ? "bg-mint-subtle text-secondary"
                        : "bg-surface-container-low text-on-surface-variant"
                    }`}
                  >
                    {doc.statusLabel}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {documentCategoryLabel(doc.category)}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="Unduh"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition-all hover:text-primary active:scale-90"
                >
                  <span className="material-symbols-outlined text-xl">download</span>
                </button>
                <button
                  type="button"
                  aria-label="Menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-xl">more_vert</span>
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="flex flex-col items-center rounded-3xl border border-sand-border bg-surface-card p-10 text-center shadow-warm-sm">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
            <span className="material-symbols-outlined text-3xl text-text-muted">
              folder_open
            </span>
          </div>
          <h4 className="font-bold text-on-surface">Belum Ada Berkas</h4>
          <p className="mt-1 max-w-xs text-sm text-text-muted">
            Tidak ada dokumen pada kategori ini. Unggah sertifikat, buku vaksin,
            atau hasil lab {catName}.
          </p>
          <Button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="mt-4 h-10 rounded-full px-4"
          >
            <span className="material-symbols-outlined mr-1 text-xl">add</span>
            Unggah Berkas
          </Button>
        </div>
      )}

      {/* Tip */}
      <aside className="flex items-start gap-3 rounded-2xl bg-amber-subtle/80 p-4">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-2xl text-primary">
          tips_and_updates
        </span>
        <div className="space-y-1">
          <p className="text-sm font-bold text-on-surface">
            Integrasi Registrasi Kitten Baru
          </p>
          <p className="text-sm text-on-surface-variant">
            Dokumen {catName} dapat ditautkan langsung saat pengajuan sertifikasi
            litter baru CFA/ICA tanpa perlu unggah ulang.
          </p>
        </div>
      </aside>

      {/* Upload modal (placeholder) */}
      {uploadOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm space-y-4 rounded-3xl bg-surface-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">
                Unggah Dokumen {catName}
              </h3>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl bg-surface-container-low p-4 text-left transition-colors active:bg-surface-container"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-2xl">
                  photo_camera
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">
                  Pindai / Ambil Foto
                </p>
                <p className="text-sm text-text-muted">
                  Kamera pemindai sertifikat cerdas
                </p>
              </div>
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl bg-surface-container-low p-4 text-left transition-colors active:bg-surface-container"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined text-2xl">
                  upload_file
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">
                  Pilih File Dokumen (PDF / JPG)
                </p>
                <p className="text-sm text-text-muted">Maksimal 15MB per berkas</p>
              </div>
            </button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setUploadOpen(false)}
              className="h-12 w-full rounded-full"
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatUploadedAt(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
