"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HealthRecordCard } from "@/components/kesehatan/health-record-card";
import { getCatName, mockHealthRecords } from "@/lib/mock";
import type { HealthRecord } from "@/types";

const FILTERS = [
  { value: "semua", label: "Semua" },
  { value: "vaccine", label: "Vaksinasi" },
  { value: "deworming", label: "Obat Cacing" },
  { value: "vet_visit", label: "Kunjungan Dokter" },
] as const;

interface KesehatanListProps {
  catId: string;
}

export function KesehatanList({ catId }: KesehatanListProps) {
  const [filter, setFilter] = useState<string>("semua");
  const [records, setRecords] = useState(() => mockHealthRecords.filter((r) => r.catId === catId));
  const [editing, setEditing] = useState<HealthRecord | null>(null);
  const [deleting, setDeleting] = useState<HealthRecord | null>(null);
  const catName = getCatName(catId);

  const visible =
    filter === "semua" ? records : records.filter((r) => r.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Rekam Medis</h3>
          <p className="text-sm text-text-muted">
            Riwayat tindakan klinis & pencegahan {catName}
          </p>
        </div>
        <Link href={`/kucing/${catId}/kesehatan/tambah`}>
          <Button className="h-10 rounded-full px-4">
            <span className="material-symbols-outlined mr-1 text-xl">add</span>
            Tambah
          </Button>
        </Link>
      </div>

      {/* Filter chips */}
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all active:scale-95 ${
              filter === f.value
                ? "bg-on-surface text-surface-card shadow-sm"
                : "bg-surface-card text-text-muted shadow-sm hover:text-on-surface"
            }`}
          >
            {f.label}
            {f.value === "semua" ? ` (${records.length})` : ""}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {visible.map((record) => (
            <HealthRecordCard
              key={record.id}
              record={record}
              onEdit={(r) => setEditing(r)}
              onDelete={(r) => setDeleting(r)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-3xl border border-sand-border bg-surface-card p-10 text-center shadow-warm-sm">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
            <span className="material-symbols-outlined text-3xl text-text-muted">
              folder_open
            </span>
          </div>
          <h4 className="font-bold text-on-surface">Belum Ada Rekam Medis</h4>
          <p className="mt-1 max-w-xs text-sm text-text-muted">
            Tidak ada catatan medis di kategori ini. Tambahkan riwayat baru
            untuk memantau kesehatan {catName}.
          </p>
          <Link href={`/kucing/${catId}/kesehatan/tambah`} className="mt-4">
            <Button className="h-10 rounded-full px-4">Tambah Catatan</Button>
          </Link>
        </div>
      )}

      <p className="rounded-2xl bg-surface-container-low p-3 text-center text-xs text-text-muted">
        Catatan ini bukan pengganti saran dokter hewan.
      </p>

      {/* Edit modal */}
      {editing && (
        <EditHealthRecordModal
          record={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => {
            setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setEditing(null);
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
            <h3 className="font-bold text-on-surface">Hapus Catatan Medis?</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Catatan &ldquo;{deleting.title ?? deleting.type}&rdquo; akan dihapus permanen. Pengingat terkait juga akan dihapus.
            </p>
            <div className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleting(null)} className="h-12 flex-1 rounded-full">
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setRecords((prev) => prev.filter((r) => r.id !== deleting.id));
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

function EditHealthRecordModal({
  record,
  onClose,
  onSave,
}: {
  record: HealthRecord;
  onClose: () => void;
  onSave: (record: HealthRecord) => void;
}) {
  const [title, setTitle] = useState(record.title ?? "");
  const [recordDate, setRecordDate] = useState(record.recordDate);
  const [nextDueDate, setNextDueDate] = useState(record.nextDueDate ?? "");
  const [vetName, setVetName] = useState(record.vetName ?? "");
  const [cost, setCost] = useState(record.cost?.toString() ?? "");
  const [notes, setNotes] = useState(record.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!recordDate) nextErrors.recordDate = "Tanggal wajib diisi";
    if (recordDate > todayStr()) nextErrors.recordDate = "Tanggal tidak boleh di masa depan";
    if (nextDueDate && recordDate && nextDueDate < recordDate) {
      nextErrors.nextDueDate = "Tanggal berikutnya tidak boleh sebelum tanggal catatan";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    // TODO: PATCH /api/health-records/:id
    onSave({
      ...record,
      title: title.trim() || null,
      recordDate,
      nextDueDate: nextDueDate || null,
      vetName: vetName.trim() || null,
      cost: cost ? parseInt(cost) : null,
      notes: notes.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">Edit Catatan Medis</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-on-surface">Nama</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="cth: Tricat Trio, Drontal"
              className="h-12 w-full rounded-2xl border-sand-border px-4"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-on-surface">Tanggal *</label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                max={todayStr()}
                className="h-12 w-full rounded-2xl border-sand-border px-4"
              />
              {errors.recordDate && <p className="text-sm text-error">{errors.recordDate}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-on-surface">Jatuh Tempo Berikutnya</label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="h-12 w-full rounded-2xl border-sand-border px-4"
              />
              {errors.nextDueDate && <p className="text-sm text-error">{errors.nextDueDate}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-on-surface">Dokter / Klinik</label>
              <input
                type="text"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
                placeholder="cth: Klinik Satwa Sehat"
                className="h-12 w-full rounded-2xl border-sand-border px-4"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-on-surface">Biaya (Rp)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="cth: 180000"
                className="h-12 w-full rounded-2xl border-sand-border px-4"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-on-surface">Catatan</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Dosis, reaksi, hal penting lainnya..."
              className="w-full rounded-2xl border-sand-border px-4 py-3"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-12 flex-1 rounded-full">
              Batal
            </Button>
            <Button type="submit" className="h-12 flex-1 rounded-full">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}