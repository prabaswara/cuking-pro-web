"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateID } from "@/lib/date";
import { documentCategoryLabel } from "@/lib/labels";

type DocumentCategory =
  | "pedigree"
  | "vaccine_book"
  | "lab"
  | "registration"
  | "other";

type DocumentItem = {
  id: string;
  title: string;
  category: DocumentCategory;
  filePath: string | null;
  fileType: "pdf" | "image";
  sizeBytes: number | null;
  uploadedAt: string;
  source: string | null;
  notes: string | null;
  verified: boolean;
};

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "pedigree", label: "Pedigree" },
  { value: "vaccine_book", label: "Buku Vaksin" },
  { value: "lab", label: "Hasil Lab / USG" },
  { value: "registration", label: "Registrasi" },
] as const;

const CATEGORY_ICON: Record<DocumentCategory, string> = {
  pedigree: "workspace_premium",
  vaccine_book: "vaccines",
  lab: "biotech",
  registration: "memory",
  other: "history_edu",
};

const CATEGORY_STYLE: Record<DocumentCategory, string> = {
  pedigree: "bg-amber-subtle text-honey-amber",
  vaccine_book: "bg-amber-subtle text-honey-amber",
  lab: "bg-tertiary-fixed text-tertiary",
  registration: "bg-secondary-container/40 text-secondary",
  other: "bg-surface-container text-on-surface-variant",
};

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: "pedigree", label: "Pedigree" },
  { value: "vaccine_book", label: "Buku Vaksin" },
  { value: "lab", label: "Hasil Lab / USG" },
  { value: "registration", label: "Registrasi" },
  { value: "other", label: "Lainnya" },
];

interface DocumentListProps {
  catId: string;
  catName: string;
  initialDocuments: DocumentItem[];
  lockedCount: number;
  windowStart: string | null;
  frozen: boolean;
}

function readApiError(data: unknown): string {
  return (
    (data as { error?: { message?: string } })?.error?.message ??
    "Terjadi kesalahan. Silakan coba lagi."
  );
}

function sizeLabel(bytes: number | null): string {
  if (bytes == null) return "Ukuran tidak diketahui";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DocumentList({
  catId,
  catName,
  initialDocuments,
  lockedCount,
  windowStart,
  frozen,
}: DocumentListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [deleting, setDeleting] = useState<DocumentItem | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const totalBytes = documents.reduce((sum, doc) => sum + (doc.sizeBytes ?? 0), 0);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Judul dokumen wajib diisi.");
      return;
    }
    if (!file) {
      setError("Pilih berkas terlebih dahulu.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/uploads/documents", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadResponse.json().catch(() => null);

      if (!uploadResponse.ok) {
        setError(readApiError(uploadData));
        return;
      }

      const stored = uploadData as {
        path: string;
        size: number;
        fileType: "pdf" | "image";
      };

      const response = await fetch(`/api/cats/${catId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          filePath: stored.path,
          fileType: stored.fileType,
          sizeBytes: stored.size,
          uploadedAt: todayStr(),
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return;
      }

      const created = (data as { document: DocumentItem }).document;
      setDocuments((prev) => [created, ...prev]);
      setUploadOpen(false);
      setTitle("");
      setCategory("other");
      setFile(null);
      setNotes("");
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
      const response = await fetch(`/api/documents/${deleting.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(readApiError(data));
        return;
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== deleting.id));
      setDeleting(null);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  }

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
                Berkas privat, hanya bisa diakses pemilik akun
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-mint-subtle px-2.5 py-1 text-xs font-semibold text-secondary">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified_user
            </span>
            Akses privat
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
              {sizeLabel(totalBytes)}
            </p>
          </div>
        </div>
      </section>

      {frozen && (
        <p className="rounded-2xl bg-amber-subtle p-3 text-sm text-on-surface">
          Kucing ini dibekukan karena batas paket Free. Dokumen hanya-baca.{" "}
          <Link href="/paket" className="font-semibold text-primary underline">
            Upgrade ke Pro
          </Link>
        </p>
      )}

      {lockedCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-lavender-subtle p-3 text-sm text-tertiary">
          <span>
            <strong>{lockedCount} dokumen terkunci</strong>
            {windowStart ? ` — unggahan sebelum ${windowStart} hanya untuk Pro.` : "."}
          </span>
          <Link href="/paket" className="shrink-0 font-semibold underline">
            Upgrade
          </Link>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-error-container p-3 text-sm text-error">{error}</p>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={() => {
            setUploadOpen(true);
            setError(null);
          }}
          disabled={frozen}
          className="h-12 rounded-full"
        >
          <span className="material-symbols-outlined mr-2 text-xl">add_circle</span>
          Unggah Berkas
        </Button>
        <Button type="button" variant="outline" disabled className="h-12 rounded-full">
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
                {f.label} ({count})
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
                  {formatDateID(doc.uploadedAt)} • {sizeLabel(doc.sizeBytes)}
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
                    {doc.verified ? "Terverifikasi" : "Belum diverifikasi"}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {documentCategoryLabel(doc.category)}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {doc.filePath ? (
                  <a
                    href={doc.filePath}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Buka dokumen"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition-all hover:text-primary active:scale-90"
                  >
                    <span className="material-symbols-outlined text-xl">download</span>
                  </a>
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-text-muted">
                    <span className="material-symbols-outlined text-xl">attach_file</span>
                  </span>
                )}
                {!frozen && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleting(doc);
                      setError(null);
                    }}
                    aria-label="Hapus dokumen"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-text-muted transition-all hover:text-error active:scale-90"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                )}
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
          {!frozen && (
            <Button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="mt-4 h-10 rounded-full px-4"
            >
              <span className="material-symbols-outlined mr-1 text-xl">add</span>
              Unggah Berkas
            </Button>
          )}
        </div>
      )}

      {/* Tip */}
      <aside className="flex items-start gap-3 rounded-2xl bg-amber-subtle/80 p-4">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-2xl text-primary">
          tips_and_updates
        </span>
        <div className="space-y-1">
          <p className="text-sm font-bold text-on-surface">Simpan Salinan Digital</p>
          <p className="text-sm text-on-surface-variant">
            Dokumen {catName} tersimpan privat. Aplikasi tidak memverifikasi
            keaslian pedigree atau sertifikat.
          </p>
        </div>
      </aside>

      {/* Upload modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={handleUpload}
            className="w-full max-w-sm space-y-4 rounded-3xl bg-surface-card p-6 shadow-2xl"
          >
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

            <div className="space-y-1">
              <Label htmlFor="doc-title">Judul Dokumen *</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth: Sertifikat Pedigree CFA"
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="doc-category">Kategori</Label>
              <select
                id="doc-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-on-surface"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="doc-file">Berkas (PDF / JPG / PNG, maks. 15 MB)</Label>
              <input
                id="doc-file"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-2xl border border-sand-border bg-surface-card p-3 text-sm text-on-surface"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="doc-notes">Catatan (opsional)</Label>
              <Textarea
                id="doc-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="rounded-2xl border-sand-border"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-error-container p-3 text-sm text-error">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadOpen(false)}
                disabled={isSaving}
                className="h-12 flex-1 rounded-full"
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className="h-12 flex-1 rounded-full">
                {isSaving ? "Mengunggah..." : "Unggah"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl">
            <h3 className="font-bold text-on-surface">Hapus Dokumen?</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              &ldquo;{deleting.title}&rdquo; akan dihapus permanen dari brankas.
            </p>
            <div className="mt-6 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleting(null)}
                disabled={isSaving}
                className="h-12 flex-1 rounded-full"
              >
                Batal
              </Button>
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
