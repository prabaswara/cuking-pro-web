"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatRupiah } from "@/lib/date";
import type { StudBookingWithDetails } from "@/lib/stud-bookings";
import { readApiError, STUD_BOOKING_STATUS_STYLE } from "@/components/pacak/stud-status";
import { ModalShell } from "@/components/pacak/stud-service-manager";

export type StudServiceOption = {
  id: string;
  catName: string;
  feeAmount: number | null;
  feeDescription: string | null;
  isBookable: boolean;
};

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function StudBookingForm({
  initial,
  services,
  defaultServiceId,
  onClose,
  onSaved,
}: {
  initial: StudBookingWithDetails | null;
  services: StudServiceOption[];
  defaultServiceId?: string;
  onClose: () => void;
  onSaved: (booking: StudBookingWithDetails) => void | Promise<void>;
}) {
  const [studServiceId, setStudServiceId] = useState(
    initial?.studServiceId ?? defaultServiceId ?? "",
  );
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [clientWhatsapp, setClientWhatsapp] = useState(
    initial?.clientWhatsapp ?? "",
  );
  const [queenName, setQueenName] = useState(initial?.queenName ?? "");
  const [queenBreed, setQueenBreed] = useState(initial?.queenBreed ?? "");
  const [queenAgeText, setQueenAgeText] = useState(
    initial?.queenAgeText ?? "",
  );
  const [plannedDate, setPlannedDate] = useState(initial?.plannedDate ?? "");
  const [feeAgreed, setFeeAgreed] = useState(
    initial?.feeAgreed != null ? String(initial.feeAgreed) : "",
  );
  const [depositAmount, setDepositAmount] = useState(
    initial?.depositAmount != null ? String(initial.depositAmount) : "",
  );
  const [depositPaid, setDepositPaid] = useState(initial?.depositPaid ?? false);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [conflicts, setConflicts] = useState<StudBookingWithDetails[] | null>(
    null,
  );

  const options = initial
    ? services
    : services.filter((service) => service.isBookable);

  function handleServiceChange(id: string) {
    setStudServiceId(id);
    const service = services.find((item) => item.id === id);

    if (service && !initial && feeAgreed.trim() === "") {
      setFeeAgreed(service.feeAmount != null ? String(service.feeAmount) : "");
    }
  }

  async function handleSubmit(event: React.FormEvent, skipConflict = false) {
    event.preventDefault();
    await saveBooking(skipConflict);
  }

  async function saveBooking(skipConflict = false) {
    const nextErrors: Record<string, string> = {};

    if (!studServiceId) nextErrors.studServiceId = "Pilih pejantan";
    if (!clientName.trim()) nextErrors.clientName = "Nama klien wajib diisi";
    if (!clientWhatsapp.trim()) {
      nextErrors.clientWhatsapp = "WhatsApp klien wajib diisi";
    }
    if (!queenName.trim()) nextErrors.queenName = "Nama betina wajib diisi";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError(null);

    try {
      if (plannedDate && !skipConflict) {
        const params = new URLSearchParams({
          stud_service_id: studServiceId,
          planned_date: plannedDate,
        });
        const conflictResponse = await fetch(`/api/stud-bookings?${params}`);
        const conflictData = await conflictResponse.json().catch(() => null);

        if (conflictResponse.ok) {
          const items = (conflictData as { items?: StudBookingWithDetails[] })
            .items ?? [];
          const activeConflicts = items.filter(
            (item) =>
              item.id !== initial?.id &&
              ["requested", "approved", "ongoing"].includes(item.status),
          );

          if (activeConflicts.length > 0) {
            setConflicts(activeConflicts);
            return;
          }
        }
      }

      const response = await fetch(
        initial ? `/api/stud-bookings/${initial.id}` : "/api/stud-bookings",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studServiceId,
            clientName: clientName.trim(),
            clientWhatsapp: clientWhatsapp.trim(),
            queenName: queenName.trim(),
            queenBreed: queenBreed.trim() || null,
            queenAgeText: queenAgeText.trim() || null,
            plannedDate: plannedDate || null,
            feeAgreed: numberOrNull(feeAgreed),
            depositAmount: numberOrNull(depositAmount),
            depositPaid,
            notes: notes.trim() || null,
          }),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return;
      }

      const booking = (data as { booking: StudBookingWithDetails }).booking;
      await onSaved(booking);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={initial ? "Edit Booking" : "Booking Baru"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-xl bg-error-container p-3 text-sm text-error">
            {error}
          </p>
        )}

        {conflicts && (
          <div className="rounded-2xl border border-amber-subtle bg-amber-subtle/40 p-3">
            <p className="text-sm font-semibold text-honey-amber">
              Jadwal bentrok dengan booking aktif
            </p>
            <div className="mt-1 space-y-1 text-sm text-text-muted">
              {conflicts.map((conflict) => (
                <p key={conflict.id}>
                  {conflict.clientName} • {conflict.queenName} •{" "}
                  {STUD_BOOKING_STATUS_STYLE[conflict.status].label}
                </p>
              ))}
            </div>
            <p className="mt-2 text-xs text-text-muted">
              Kamu tetap boleh menyimpan booking ini. Pastikan jadwalnya
              benar-benar bisa ditangani.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3 h-9 rounded-full"
              disabled={saving}
              onClick={() => saveBooking(true)}
            >
              {saving ? "Menyimpan..." : "Tetap Simpan"}
            </Button>
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="bookingStud">Pejantan *</Label>
          <select
            id="bookingStud"
            value={studServiceId}
            onChange={(event) => handleServiceChange(event.target.value)}
            disabled={Boolean(initial)}
            className="h-12 w-full rounded-2xl border border-sand-border bg-surface-card px-4 text-sm disabled:opacity-60"
          >
            <option value="">Pilih pejantan</option>
            {options.map((service) => (
              <option key={service.id} value={service.id}>
                {service.catName}
                {service.feeAmount != null
                  ? ` — ${formatRupiah(service.feeAmount)}`
                  : service.feeDescription
                    ? ` — ${service.feeDescription}`
                    : ""}
              </option>
            ))}
          </select>
          {errors.studServiceId && (
            <p className="text-sm text-error">{errors.studServiceId}</p>
          )}
          {options.length === 0 && (
            <p className="text-xs text-text-muted">
              Belum ada pejantan tersedia. Aktifkan pejantan di tab Pejantan
              Pacak.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="bookingClient">Nama Klien *</Label>
          <Input
            id="bookingClient"
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="cth: Dian Pratama"
            className="h-12 rounded-2xl border-sand-border"
          />
          {errors.clientName && (
            <p className="text-sm text-error">{errors.clientName}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="bookingWhatsapp">WhatsApp Klien *</Label>
          <Input
            id="bookingWhatsapp"
            value={clientWhatsapp}
            onChange={(event) => setClientWhatsapp(event.target.value)}
            placeholder="08xxxxxxxxxx"
            className="h-12 rounded-2xl border-sand-border"
          />
          {errors.clientWhatsapp && (
            <p className="text-sm text-error">{errors.clientWhatsapp}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="bookingQueen">Nama Betina *</Label>
          <Input
            id="bookingQueen"
            value={queenName}
            onChange={(event) => setQueenName(event.target.value)}
            placeholder="cth: Bella"
            className="h-12 rounded-2xl border-sand-border"
          />
          {errors.queenName && (
            <p className="text-sm text-error">{errors.queenName}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="bookingBreed">Ras Betina</Label>
            <Input
              id="bookingBreed"
              value={queenBreed}
              onChange={(event) => setQueenBreed(event.target.value)}
              placeholder="Opsional"
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bookingAge">Umur Betina</Label>
            <Input
              id="bookingAge"
              value={queenAgeText}
              onChange={(event) => setQueenAgeText(event.target.value)}
              placeholder="cth: 2 tahun"
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="bookingDate">Tanggal Rencana</Label>
          <Input
            id="bookingDate"
            type="date"
            value={plannedDate}
            onChange={(event) => setPlannedDate(event.target.value)}
            className="h-12 rounded-2xl border-sand-border"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="bookingFee">Tarif Disepakati</Label>
            <Input
              id="bookingFee"
              type="number"
              min={0}
              value={feeAgreed}
              onChange={(event) => setFeeAgreed(event.target.value)}
              placeholder="Rp"
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bookingDeposit">DP</Label>
            <Input
              id="bookingDeposit"
              type="number"
              min={0}
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
              placeholder="Rp"
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-2xl bg-surface-container-low p-3 text-sm font-medium text-on-surface">
          <input
            type="checkbox"
            checked={depositPaid}
            onChange={(event) => setDepositPaid(event.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          DP sudah dibayar
        </label>

        <div className="space-y-1">
          <Label htmlFor="bookingNotes">Catatan</Label>
          <Textarea
            id="bookingNotes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Permintaan khusus atau info tambahan"
            className="rounded-2xl border-sand-border"
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
