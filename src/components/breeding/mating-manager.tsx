"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addDaysIso, formatDateID, todayIso } from "@/lib/date";
import type { MatingWithDetails } from "@/lib/matings";
import type { MatingOutcome } from "@/lib/validation/breeding";
import type { BreedingCatOption } from "@/components/breeding/breeding-tabs";

const OUTCOME_STYLE: Record<
  MatingOutcome,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: "bg-amber-subtle",
    text: "text-honey-amber",
    label: "Menunggu Konfirmasi",
  },
  pregnant: { bg: "bg-error-container", text: "text-error", label: "Hamil" },
  not_pregnant: {
    bg: "bg-surface-container",
    text: "text-on-surface-variant",
    label: "Tidak Hamil",
  },
  delivered: {
    bg: "bg-mint-subtle",
    text: "text-secondary",
    label: "Sudah Melahirkan",
  },
};

type Filter = "semua" | "pregnant" | "pending" | "history";

function readApiError(data: unknown): string {
  return (
    (data as { error?: { message?: string } })?.error?.message ??
    "Terjadi kesalahan. Silakan coba lagi."
  );
}

function sortMatings(items: MatingWithDetails[]): MatingWithDetails[] {
  return [...items].sort((a, b) => b.matingDate.localeCompare(a.matingDate));
}

export function MatingManager({
  initial,
  females,
  males,
}: {
  initial: {
    items: MatingWithDetails[];
    lockedCount: number;
    windowStart: string | null;
  };
  females: BreedingCatOption[];
  males: BreedingCatOption[];
}) {
  const [matings, setMatings] = useState<MatingWithDetails[]>(() =>
    sortMatings(initial.items),
  );
  const [filter, setFilter] = useState<Filter>("semua");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MatingWithDetails | null>(null);
  const [deleting, setDeleting] = useState<MatingWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const visible = useMemo(() => {
    return matings.filter((mating) => {
      if (filter === "semua") return true;
      if (filter === "pregnant") return mating.outcome === "pregnant";
      if (filter === "pending") return mating.outcome === "pending";
      return (
        mating.outcome === "not_pregnant" || mating.outcome === "delivered"
      );
    });
  }, [filter, matings]);

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/matings/${deleting.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(readApiError(data));
        return;
      }

      setMatings((prev) => prev.filter((mating) => mating.id !== deleting.id));
      setDeleting(null);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-on-surface">
            Catatan Kawin & Kehamilan
          </h3>
          <p className="text-sm text-text-muted">
            Pantau kawin dan kehamilan kucing
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setError(null);
            setOpen(true);
          }}
          className="h-10 rounded-full px-4"
        >
          <span className="material-symbols-outlined mr-1 text-xl">add</span>
          Catat Kawin
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["semua", "Semua"],
            ["pregnant", "Hamil"],
            ["pending", "Menunggu"],
            ["history", "Riwayat"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
              filter === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface-card text-text-muted shadow-sm"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && !open && !deleting && (
        <p className="rounded-xl bg-error-container p-3 text-sm text-error">
          {error}
        </p>
      )}

      {initial.lockedCount > 0 && initial.windowStart && (
        <p className="rounded-2xl border border-amber-subtle bg-amber-subtle/40 p-3 text-sm text-honey-amber">
          {initial.lockedCount} catatan kawin lama terkunci di paket Free.
          Kehamilan yang belum selesai tetap ditampilkan.
        </p>
      )}

      {visible.length === 0 ? (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-3xl text-text-muted">
                pets
              </span>
            </div>
            <h4 className="font-bold text-on-surface">
              Belum Ada Catatan Kawin
            </h4>
            <p className="mt-1 max-w-xs text-sm text-text-muted">
              Catat kawin pertama untuk memulai pemantauan kehamilan.
            </p>
            <Button
              type="button"
              onClick={() => {
                setEditing(null);
                setError(null);
                setOpen(true);
              }}
              className="mt-4 h-10 rounded-full px-4"
            >
              Catat Kawin Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((mating) => {
            const style = OUTCOME_STYLE[mating.outcome];

            return (
              <Card
                key={mating.id}
                className="rounded-3xl border-sand-border shadow-warm-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lavender-subtle text-tertiary">
                        <span className="material-symbols-outlined text-xl">
                          favorite
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-bold text-on-surface">
                            {mating.queenName}
                          </p>
                          <span className="text-text-muted">×</span>
                          <p className="truncate font-medium text-on-surface">
                            {mating.sireName}
                          </p>
                        </div>
                        <p className="text-sm text-text-muted">
                          Kawin: {formatDateID(mating.matingDate)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${style.bg} ${style.text} shrink-0`}
                    >
                      {style.label}
                    </Badge>
                  </div>

                  {mating.relationshipWarning && (
                    <p className="mt-3 rounded-2xl border border-amber-subtle bg-amber-subtle/40 p-3 text-sm text-honey-amber">
                      {mating.relationshipWarning}
                    </p>
                  )}

                  {mating.outcome === "pregnant" && (
                    <div className="mt-3 rounded-2xl border border-error-container bg-error-container/20 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-error">
                          Estimasi Lahir:{" "}
                          {mating.expectedDueDate
                            ? formatDateID(mating.expectedDueDate)
                            : "-"}
                        </span>
                        <Link href={`/breeding/kehamilan/${mating.id}`}>
                          <Button size="sm" className="h-8 rounded-full">
                            Kelola
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {mating.litter && (
                    <div className="mt-3 rounded-2xl border border-soft-mint bg-mint-subtle p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-secondary">
                          Litter: {mating.litter.totalAlive}/
                          {mating.litter.totalBorn} hidup • Lahir{" "}
                          {formatDateID(mating.litter.birthDate)}
                        </span>
                        <Link href={`/breeding/litter/${mating.litter.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full"
                          >
                            Lihat Anak
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {mating.notes && (
                    <p className="mt-2 rounded-2xl bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
                      {mating.notes}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(mating);
                        setError(null);
                        setOpen(true);
                      }}
                      className="h-9 rounded-full px-3"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleting(mating);
                        setError(null);
                      }}
                      className="h-9 rounded-full px-3 text-error"
                    >
                      Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {open && (
        <MatingForm
          initial={editing}
          females={females}
          males={males}
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
                editing ? `/api/matings/${editing.id}` : "/api/matings",
                {
                  method: editing ? "PATCH" : "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                },
              );

              const data = await response.json().catch(() => null);

              if (!response.ok) {
                setError(readApiError(data));
                return;
              }

              const saved = (data as { mating: MatingWithDetails }).mating;

              setMatings((prev) =>
                sortMatings(
                  editing
                    ? prev.map((mating) =>
                        mating.id === editing.id ? saved : mating,
                      )
                    : [...prev, saved],
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
            <h3 className="font-bold text-on-surface">Hapus Catatan Kawin?</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Catatan {deleting.queenName} × {deleting.sireName} akan dihapus.
              {deleting.litter &&
                " Litter dan tautan anak kucing ikut terhapus dari catatan ini."}
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

type ParentMode = "own" | "external";

function MatingForm({
  initial,
  females,
  males,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  initial: MatingWithDetails | null;
  females: BreedingCatOption[];
  males: BreedingCatOption[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const [queenMode, setQueenMode] = useState<ParentMode>(
    initial ? (initial.queenId ? "own" : "external") : females.length ? "own" : "external",
  );
  const [queenId, setQueenId] = useState(initial?.queenId ?? "");
  const [queenName, setQueenName] = useState(initial?.queenNameManual ?? "");
  const [sireMode, setSireMode] = useState<ParentMode>(
    initial ? (initial.sireId ? "own" : "external") : males.length ? "own" : "external",
  );
  const [sireId, setSireId] = useState(initial?.sireId ?? "");
  const [sireName, setSireName] = useState(initial?.sireNameManual ?? "");
  const [matingDate, setMatingDate] = useState(
    initial?.matingDate ?? todayIso(),
  );
  const [outcome, setOutcome] = useState<MatingOutcome>(
    initial?.outcome ?? "pending",
  );
  const [expectedDueDate, setExpectedDueDate] = useState(
    initial?.expectedDueDate ?? "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const relationshipWarning = useMemo(() => {
    const queen = females.find((cat) => cat.id === queenId);
    const sire = males.find((cat) => cat.id === sireId);
    if (!queen || !sire) return null;

    if (queen.sireId === sire.id || queen.damId === sire.id) {
      return `${sire.name} adalah orang tua langsung dari ${queen.name}. Kawin sedarah tetap bisa disimpan, tetapi pertimbangkan kesehatan keturunan.`;
    }
    if (sire.sireId === queen.id || sire.damId === queen.id) {
      return `${queen.name} adalah orang tua langsung dari ${sire.name}. Kawin sedarah tetap bisa disimpan, tetapi pertimbangkan kesehatan keturunan.`;
    }
    return null;
  }, [females, males, queenId, sireId]);

  const defaultDueDate =
    matingDate && outcome === "pregnant"
      ? addDaysIso(matingDate, 65)
      : null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (queenMode === "own" && !queenId) nextErrors.queenId = "Pilih betina";
    if (queenMode === "external" && !queenName.trim()) {
      nextErrors.queenNameManual = "Nama betina wajib diisi";
    }
    if (sireMode === "own" && !sireId) nextErrors.sireId = "Pilih pejantan";
    if (sireMode === "external" && !sireName.trim()) {
      nextErrors.sireNameManual = "Nama pejantan wajib diisi";
    }
    if (!matingDate) nextErrors.matingDate = "Tanggal kawin wajib diisi";
    if (matingDate > todayIso()) {
      nextErrors.matingDate = "Tanggal tidak boleh di masa depan";
    }
    if (
      expectedDueDate &&
      matingDate &&
      expectedDueDate < matingDate
    ) {
      nextErrors.expectedDueDate =
        "Estimasi lahir tidak boleh sebelum tanggal kawin";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      queenId: queenMode === "own" ? queenId : null,
      queenNameManual: queenMode === "external" ? queenName.trim() : null,
      sireId: sireMode === "own" ? sireId : null,
      sireNameManual: sireMode === "external" ? sireName.trim() : null,
      matingDate,
      outcome,
      expectedDueDate:
        outcome === "pregnant" ? expectedDueDate || null : null,
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
            {initial ? "Edit Catatan Kawin" : "Catat Kawin Baru"}
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

        <ParentFields
          label="Betina"
          mode={queenMode}
          onModeChange={setQueenMode}
          catId={queenId}
          onCatChange={setQueenId}
          manualName={queenName}
          onManualNameChange={setQueenName}
          cats={females}
          optionsLabel="Pilih betina"
          error={
            errors.queenId ??
            errors.queenNameManual
          }
        />

        <ParentFields
          label="Pejantan"
          mode={sireMode}
          onModeChange={setSireMode}
          catId={sireId}
          onCatChange={setSireId}
          manualName={sireName}
          onManualNameChange={setSireName}
          cats={males}
          optionsLabel="Pilih pejantan"
          error={errors.sireId ?? errors.sireNameManual}
        />

        {relationshipWarning && (
          <p className="rounded-2xl border border-amber-subtle bg-amber-subtle/40 p-3 text-sm text-honey-amber">
            {relationshipWarning}
          </p>
        )}

        <div className="space-y-1">
          <Label htmlFor="mating-date">Tanggal Kawin *</Label>
          <Input
            id="mating-date"
            type="date"
            value={matingDate}
            max={todayIso()}
            onChange={(event) => setMatingDate(event.target.value)}
            className="h-12 rounded-2xl border-sand-border"
          />
          {errors.matingDate && (
            <p className="text-sm text-error">{errors.matingDate}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="mating-outcome">Hasil</Label>
          <select
            id="mating-outcome"
            value={outcome}
            onChange={(event) =>
              setOutcome(event.target.value as MatingOutcome)
            }
            disabled={initial?.outcome === "delivered"}
            className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-on-surface disabled:opacity-60"
          >
            <option value="pending">Menunggu Konfirmasi</option>
            <option value="pregnant">Hamil</option>
            <option value="not_pregnant">Tidak Hamil</option>
            {initial?.outcome === "delivered" && (
              <option value="delivered">Sudah Melahirkan</option>
            )}
          </select>
        </div>

        {outcome === "pregnant" && (
          <div className="space-y-1">
            <Label htmlFor="mating-due">Estimasi Lahir</Label>
            <Input
              id="mating-due"
              type="date"
              value={expectedDueDate}
              min={matingDate}
              onChange={(event) => setExpectedDueDate(event.target.value)}
              className="h-12 rounded-2xl border-sand-border"
            />
            <p className="text-xs text-text-muted">
              {defaultDueDate
                ? `Kosongkan untuk otomatis +65 hari: ${formatDateID(defaultDueDate)}`
                : "Diisi otomatis +65 hari dari tanggal kawin bila kosong."}
            </p>
            {errors.expectedDueDate && (
              <p className="text-sm text-error">{errors.expectedDueDate}</p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="mating-notes">Catatan</Label>
          <Textarea
            id="mating-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Detail kawin, dll."
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

function ParentFields({
  label,
  mode,
  onModeChange,
  catId,
  onCatChange,
  manualName,
  onManualNameChange,
  cats,
  optionsLabel,
  error,
}: {
  label: string;
  mode: ParentMode;
  onModeChange: (mode: ParentMode) => void;
  catId: string;
  onCatChange: (id: string) => void;
  manualName: string;
  onManualNameChange: (name: string) => void;
  cats: BreedingCatOption[];
  optionsLabel: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label} *</Label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onModeChange("own")}
          className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${
            mode === "own"
              ? "border-primary bg-tangerine-subtle text-primary"
              : "border-sand-border bg-surface-card text-on-surface"
          }`}
        >
          Kucing Saya
        </button>
        <button
          type="button"
          onClick={() => onModeChange("external")}
          className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${
            mode === "external"
              ? "border-primary bg-tangerine-subtle text-primary"
              : "border-sand-border bg-surface-card text-on-surface"
          }`}
        >
          {label} Luar
        </button>
      </div>

      {mode === "own" ? (
        <select
          value={catId}
          onChange={(event) => onCatChange(event.target.value)}
          className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-on-surface"
        >
          <option value="">{optionsLabel}</option>
          {cats.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
              {cat.breed ? ` (${cat.breed})` : ""}
            </option>
          ))}
        </select>
      ) : (
        <Input
          value={manualName}
          onChange={(event) => onManualNameChange(event.target.value)}
          placeholder={`Nama ${label.toLowerCase()} luar`}
          className="h-12 rounded-2xl border-sand-border"
        />
      )}

      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
