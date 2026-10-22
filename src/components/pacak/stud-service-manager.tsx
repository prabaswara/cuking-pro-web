"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatRupiah } from "@/lib/date";
import type { StudServiceWithStats } from "@/lib/stud-bookings";
import { readApiError } from "@/components/pacak/stud-status";

export type StudCatOption = {
  id: string;
  name: string;
  breed: string | null;
  color: string | null;
  photoPath: string | null;
};

export function StudServiceManager({
  initial,
  cats,
}: {
  initial: StudServiceWithStats[];
  cats: StudCatOption[];
}) {
  const router = useRouter();
  const [services, setServices] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudServiceWithStats | null>(null);
  const [deleting, setDeleting] = useState<StudServiceWithStats | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const response = await fetch("/api/stud-services");
    const data = await response.json().catch(() => null);
    if (response.ok) {
      setServices((data as { services: StudServiceWithStats[] }).services);
    }
  }

  async function toggleAvailability(service: StudServiceWithStats) {
    setBusyId(service.id);
    setError(null);

    try {
      const response = await fetch(`/api/stud-services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !service.isAvailable }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return;
      }

      const updated = (data as { service: StudServiceWithStats }).service;
      setServices((prev) =>
        prev.map((item) =>
          item.id === service.id ? { ...item, ...updated } : item,
        ),
      );
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    setError(null);

    try {
      const response = await fetch(`/api/stud-services/${deleting.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(readApiError(data));
        return;
      }

      setServices((prev) => prev.filter((item) => item.id !== deleting.id));
      setDeleting(null);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setBusyId(null);
    }
  }

  const servicedCatIds = new Set(
    services
      .filter((service) => service.id !== editing?.id)
      .map((service) => service.catId)
      .filter((id): id is string => Boolean(id)),
  );
  const availableCats = cats.filter((cat) => !servicedCatIds.has(cat.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Pejantan Pacak</h3>
          <p className="text-sm text-text-muted">
            Pilih kucing jantan yang ditawarkan dan atur tarifnya
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setError(null);
            setOpen(true);
          }}
          disabled={availableCats.length === 0}
          className="h-10 rounded-full px-4"
        >
          <span className="material-symbols-outlined mr-1 text-xl">add</span>
          Tambah Pejantan
        </Button>
      </div>

      {error && !open && !deleting && (
        <p className="rounded-xl bg-error-container p-3 text-sm text-error">
          {error}
        </p>
      )}

      {services.length === 0 ? (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-lavender-subtle">
              <span className="material-symbols-outlined text-3xl text-tertiary">
                cruelty_free
              </span>
            </div>
            <h4 className="font-bold text-on-surface">Belum Ada Pejantan</h4>
            <p className="mt-1 max-w-xs text-sm text-text-muted">
              {cats.length === 0
                ? "Tambahkan kucing jantan aktif dan dilacak terlebih dahulu."
                : "Daftarkan pejantan pertama yang siap menerima booking klien."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <Card
              key={service.id}
              className="rounded-3xl border-sand-border shadow-warm-sm"
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                  {service.catPhotoPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={service.catPhotoPath}
                      alt={service.catName}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-lavender-subtle text-tertiary">
                      <span className="material-symbols-outlined">pets</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-bold text-on-surface">
                        {service.catName}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          service.isBookable
                            ? "bg-mint-subtle text-secondary"
                            : "bg-surface-container text-on-surface-variant"
                        }
                      >
                        {service.isBookable ? "Tersedia" : "Tidak Tersedia"}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-text-muted">
                      {[service.catBreed, service.catColor]
                        .filter(Boolean)
                        .join(" • ") || "Data kucing"}
                    </p>
                    <p className="mt-1 font-semibold text-primary">
                      {service.feeDescription ||
                        (service.feeAmount != null
                          ? formatRupiah(service.feeAmount)
                          : "-")}
                    </p>
                  </div>
                  <Switch
                    checked={service.isAvailable}
                    onCheckedChange={() => toggleAvailability(service)}
                    disabled={busyId === service.id || service.catTrackingStatus === "frozen"}
                    aria-label="Ketersediaan pejantan"
                  />
                </div>

                {service.notes && (
                  <p className="rounded-2xl bg-surface-container-low p-3 text-sm text-text-muted">
                    {service.notes}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-surface-container-low p-2">
                    <p className="text-base font-bold text-on-surface">
                      {service.stats.bookingCount}
                    </p>
                    <p className="text-[11px] text-text-muted">Booking</p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low p-2">
                    <p className="text-base font-bold text-on-surface">
                      {service.stats.matingCount}
                    </p>
                    <p className="text-[11px] text-text-muted">Kawin</p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low p-2">
                    <p className="text-base font-bold text-on-surface">
                      {service.stats.pregnantCount + service.stats.deliveredCount}
                    </p>
                    <p className="text-[11px] text-text-muted">Hamil/Lahir</p>
                  </div>
                </div>

                {service.catTrackingStatus === "frozen" && (
                  <p className="rounded-2xl bg-error-container/40 p-2 text-xs text-error">
                    Kucing dibekukan karena batas paket Free.
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 rounded-full"
                    onClick={() => {
                      setEditing(service);
                      setError(null);
                      setOpen(true);
                    }}
                  >
                    <span className="material-symbols-outlined mr-1 text-base">
                      edit
                    </span>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full text-error"
                    onClick={() => {
                      setError(null);
                      setDeleting(service);
                    }}
                    disabled={service.stats.bookingCount > 0}
                  >
                    <span className="material-symbols-outlined text-base">
                      delete
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <StudServiceForm
          key={editing?.id ?? "new"}
          initial={editing}
          cats={editing ? cats : availableCats}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSaved={async () => {
            await reload();
            router.refresh();
            setOpen(false);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus Pejantan?"
          description={`Profil pacak ${deleting.catName} akan dihapus. Riwayat booking harus kosong.`}
          busy={busyId === deleting.id}
          error={error}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function StudServiceForm({
  initial,
  cats,
  onClose,
  onSaved,
}: {
  initial: StudServiceWithStats | null;
  cats: StudCatOption[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [catId, setCatId] = useState(initial?.catId ?? "");
  const [feeType, setFeeType] = useState<"nominal" | "deskripsi">(
    initial?.feeDescription && initial.feeAmount == null ? "deskripsi" : "nominal",
  );
  const [feeAmount, setFeeAmount] = useState(
    initial?.feeAmount != null ? String(initial.feeAmount) : "",
  );
  const [feeDescription, setFeeDescription] = useState(
    initial?.feeDescription ?? "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [isAvailable, setIsAvailable] = useState(initial?.isAvailable ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!initial && !catId) nextErrors.catId = "Pilih kucing jantan";
    if (feeType === "nominal") {
      if (feeAmount.trim() === "") {
        nextErrors.feeAmount = "Isi tarif nominal";
      } else if (Number(feeAmount) < 0) {
        nextErrors.feeAmount = "Tarif tidak boleh negatif";
      }
    } else if (!feeDescription.trim()) {
      nextErrors.feeDescription = "Isi deskripsi tarif";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...(initial ? {} : { catId }),
        feeAmount: feeType === "nominal" ? Number(feeAmount) : null,
        feeDescription:
          feeType === "deskripsi" ? feeDescription.trim() : null,
        notes: notes.trim() || null,
        isAvailable,
      };

      const response = await fetch(
        initial ? `/api/stud-services/${initial.id}` : "/api/stud-services",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return;
      }

      await onSaved();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title={initial ? "Edit Pejantan" : "Tambah Pejantan"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-xl bg-error-container p-3 text-sm text-error">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <Label htmlFor="studCat">Kucing Jantan *</Label>
          <select
            id="studCat"
            value={catId}
            onChange={(event) => setCatId(event.target.value)}
            disabled={Boolean(initial)}
            className="h-12 w-full rounded-2xl border border-sand-border bg-surface-card px-4 text-sm disabled:opacity-60"
          >
            <option value="">Pilih kucing jantan</option>
            {cats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
                {cat.breed ? ` — ${cat.breed}` : ""}
              </option>
            ))}
          </select>
          {errors.catId && <p className="text-sm text-error">{errors.catId}</p>}
          {cats.length === 0 && (
            <p className="text-xs text-text-muted">
              Tidak ada kucing jantan aktif/dilacak yang belum terdaftar.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Jenis Tarif</Label>
          <div className="flex gap-2">
            {(["nominal", "deskripsi"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFeeType(type)}
                className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${
                  feeType === type
                    ? "border-primary bg-tangerine-subtle text-primary"
                    : "border-sand-border bg-surface-card text-on-surface"
                }`}
              >
                {type === "nominal" ? "Nominal (Rp)" : "Deskripsi"}
              </button>
            ))}
          </div>
        </div>

        {feeType === "nominal" ? (
          <div className="space-y-1">
            <Label htmlFor="feeAmount">Tarif (Rp)</Label>
            <Input
              id="feeAmount"
              type="number"
              min={0}
              step={100000}
              value={feeAmount}
              onChange={(event) => setFeeAmount(event.target.value)}
              placeholder="cth: 3000000"
              className="h-12 rounded-2xl border-sand-border"
            />
            {errors.feeAmount && (
              <p className="text-sm text-error">{errors.feeAmount}</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor="feeDescription">Deskripsi Tarif</Label>
            <Input
              id="feeDescription"
              value={feeDescription}
              onChange={(event) => setFeeDescription(event.target.value)}
              placeholder="cth: anak pilihan pertama"
              className="h-12 rounded-2xl border-sand-border"
            />
            {errors.feeDescription && (
              <p className="text-sm text-error">{errors.feeDescription}</p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="studNotes">Catatan</Label>
          <Textarea
            id="studNotes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Informasi tambahan untuk klien"
            className="rounded-2xl border-sand-border"
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-surface-container-low p-3">
          <div>
            <p className="font-semibold text-on-surface">Tersedia</p>
            <p className="text-xs text-text-muted">
              Nonaktifkan sementara tanpa menghapus profil
            </p>
          </div>
          <Switch
            checked={isAvailable}
            onCheckedChange={setIsAvailable}
            aria-label="Ketersediaan pejantan"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
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
    </ModalShell>
  );
}

export function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl">
        <h3 className="font-bold text-on-surface">{title}</h3>
        <p className="mt-2 text-sm text-text-muted">{description}</p>
        {error && (
          <p className="mt-3 rounded-xl bg-error-container p-3 text-sm text-error">
            {error}
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={busy}
            className="h-11 flex-1 rounded-full"
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={busy}
            className="h-11 flex-1 rounded-full"
          >
            {busy ? "Menghapus..." : "Hapus"}
          </Button>
        </div>
      </div>
    </div>
  );
}
