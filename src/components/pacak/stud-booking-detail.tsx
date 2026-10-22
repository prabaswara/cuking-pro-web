"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateID, formatRupiah, todayIso } from "@/lib/date";
import type { StudBookingWithDetails } from "@/lib/stud-bookings";
import type { StudBookingStatus } from "@/lib/validation/stud";
import {
  PREGNANCY_STATUS_OPTIONS,
  readApiError,
  STUD_BOOKING_STATUS_STYLE,
  whatsappUrl,
} from "@/components/pacak/stud-status";
import {
  ConfirmDialog,
  ModalShell,
} from "@/components/pacak/stud-service-manager";
import {
  StudBookingForm,
  type StudServiceOption,
} from "@/components/pacak/stud-booking-form";

export function StudBookingDetail({
  initial,
  services,
}: {
  initial: StudBookingWithDetails;
  services: StudServiceOption[];
}) {
  const router = useRouter();
  const [booking, setBooking] = useState(initial);
  const [editOpen, setEditOpen] = useState(false);
  const [matingOpen, setMatingOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);
  const [deletingMating, setDeletingMating] = useState<
    StudBookingWithDetails["matings"][number] | null
  >(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const style = STUD_BOOKING_STATUS_STYLE[booking.status];
  const wa = whatsappUrl(
    booking.clientWhatsapp,
    `Halo ${booking.clientName}, saya menghubungi terkait booking pacak ${booking.queenName} di cukingPro.`,
  );

  async function reloadBooking() {
    const response = await fetch(`/api/stud-bookings/${booking.id}`);
    const data = await response.json().catch(() => null);

    if (response.ok) {
      setBooking((data as { booking: StudBookingWithDetails }).booking);
    }
  }

  async function patchBooking(
    payload: Record<string, unknown>,
    busyKey = "status",
  ) {
    setBusy(busyKey);
    setError(null);

    try {
      const response = await fetch(`/api/stud-bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return false;
      }

      setBooking((data as { booking: StudBookingWithDetails }).booking);
      router.refresh();
      return true;
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(status: StudBookingStatus) {
    await patchBooking({ status });
  }

  async function deleteMating() {
    if (!deletingMating) return;
    setBusy("delete-mating");
    setError(null);

    try {
      const response = await fetch(
        `/api/booking-matings/${deletingMating.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(readApiError(data));
        return;
      }

      setDeletingMating(null);
      await reloadBooking();
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  const canEditMating = ["requested", "approved", "ongoing"].includes(
    booking.status,
  );

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl bg-error-container p-3 text-sm text-error">
          {error}
        </p>
      )}

      {booking.isOverdue && (
        <div className="rounded-2xl border border-error/30 bg-error-container/40 p-3">
          <p className="font-semibold text-error">Melewati estimasi lahir</p>
          <p className="mt-1 text-sm text-text-muted">
            Perbarui status kehamilan betina klien untuk menutup pengingat.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-8 rounded-full"
            onClick={() =>
              patchBooking({ queenPregnancyStatus: "delivered" }, "pregnancy")
            }
            disabled={busy === "pregnancy"}
          >
            Tandai Sudah Melahirkan
          </Button>
        </div>
      )}

      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Ringkasan Booking</CardTitle>
              <CardDescription>
                Pejantan: {booking.service.catName}
              </CardDescription>
            </div>
            <Badge variant="outline" className={`${style.bg} ${style.text}`}>
              {style.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface-container-low p-3">
              <p className="text-xs text-text-muted">Betina Klien</p>
              <p className="font-bold text-on-surface">{booking.queenName}</p>
              <p className="text-sm text-text-muted">
                {[booking.queenBreed, booking.queenAgeText]
                  .filter(Boolean)
                  .join(" • ") || "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-3">
              <p className="text-xs text-text-muted">Tanggal Rencana</p>
              <p className="font-bold text-on-surface">
                {booking.plannedDate
                  ? formatDateID(booking.plannedDate)
                  : "Belum ditentukan"}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-3">
              <p className="text-xs text-text-muted">Tarif Disepakati</p>
              <p className="font-bold text-on-surface">
                {formatRupiah(booking.feeAgreed)}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-3">
              <p className="text-xs text-text-muted">DP</p>
              <p className="font-semibold text-on-surface">
                {formatRupiah(booking.depositAmount)}{" "}
                {booking.depositAmount != null
                  ? booking.depositPaid
                    ? "(Lunas)"
                    : "(Belum)"
                  : ""}
              </p>
            </div>
          </div>

          {booking.notes && (
            <p className="rounded-2xl bg-surface-container-low p-3 text-sm text-text-muted">
              {booking.notes}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <a href={wa} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-9 rounded-full">
                <span className="material-symbols-outlined mr-1 text-base">
                  chat
                </span>
                WhatsApp Klien
              </Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full"
              onClick={() => setEditOpen(true)}
            >
              Edit Booking
            </Button>

            {booking.status === "requested" && (
              <>
                <Button
                  size="sm"
                  className="h-9 rounded-full"
                  onClick={() => changeStatus("approved")}
                  disabled={busy === "status"}
                >
                  Setujui
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full"
                  onClick={() => changeStatus("rejected")}
                  disabled={busy === "status"}
                >
                  Tolak
                </Button>
              </>
            )}

            {booking.status === "approved" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full"
                  onClick={() => changeStatus("rejected")}
                  disabled={busy === "status"}
                >
                  Tolak
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full"
                  onClick={() => changeStatus("cancelled")}
                  disabled={busy === "status"}
                >
                  Batalkan
                </Button>
              </>
            )}

            {booking.status === "ongoing" && (
              <>
                <Button
                  size="sm"
                  className="h-9 rounded-full"
                  onClick={() => changeStatus("completed")}
                  disabled={busy === "status" || booking.matingCount === 0}
                >
                  Selesaikan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full"
                  onClick={() => changeStatus("cancelled")}
                  disabled={busy === "status"}
                >
                  Batalkan
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Catatan Kawin</CardTitle>
              <CardDescription>
                Kawin pertama, jumlah kawin, dan estimasi lahir
              </CardDescription>
            </div>
            {canEditMating && (
              <Button
                size="sm"
                className="h-9 rounded-full"
                onClick={() => setMatingOpen(true)}
              >
                <span className="material-symbols-outlined mr-1 text-lg">
                  add
                </span>
                Catat Kawin
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {booking.matingCount > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-lavender-subtle p-3 text-center">
                  <p className="text-sm font-bold text-tertiary">
                    {formatDateID(booking.firstMatingDate)}
                  </p>
                  <p className="text-[11px] text-text-muted">Kawin Pertama</p>
                </div>
                <div className="rounded-2xl bg-tangerine-subtle p-3 text-center">
                  <p className="text-base font-bold text-primary">
                    {booking.matingCount}×
                  </p>
                  <p className="text-[11px] text-text-muted">Total Kawin</p>
                </div>
                <div className="rounded-2xl bg-error-container/30 p-3 text-center">
                  <p className="text-sm font-bold text-error">
                    {formatDateID(booking.expectedDueDate)}
                  </p>
                  <p className="text-[11px] text-text-muted">Estimasi Lahir</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-text-muted">
                  Estimasi lahir{" "}
                  {booking.expectedDueDateManual
                    ? "diatur manual"
                    : "dihitung otomatis (kawin pertama + 65 hari)"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full"
                  onClick={() => setDueOpen(true)}
                >
                  Ubah Estimasi
                </Button>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-3">
                <p className="text-xs font-semibold text-text-muted">
                  Status Kehamilan Betina
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PREGNANCY_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        patchBooking(
                          { queenPregnancyStatus: option.value },
                          "pregnancy",
                        )
                      }
                      disabled={busy === "pregnancy"}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                        booking.queenPregnancyStatus === option.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-card text-text-muted"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-on-surface">
                  Riwayat Kawin
                </p>
                {booking.matings.map((mating, index) => (
                  <div
                    key={mating.id}
                    className="flex items-center justify-between rounded-2xl bg-surface-container-low p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lavender-subtle text-sm font-bold text-tertiary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-on-surface">
                          {formatDateID(mating.matingDate)}
                        </p>
                        {mating.notes && (
                          <p className="text-xs text-text-muted">
                            {mating.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    {canEditMating && (
                      <button
                        type="button"
                        onClick={() => setDeletingMating(mating)}
                        aria-label="Hapus catatan kawin"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-error-container hover:text-error"
                      >
                        <span className="material-symbols-outlined text-lg">
                          delete
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-surface-container-low p-6 text-center">
              <p className="font-semibold text-on-surface">
                Belum ada kawin tercatat
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Catat kawin pertama untuk mengaktifkan estimasi lahir.
              </p>
              {canEditMating && (
                <Button
                  onClick={() => setMatingOpen(true)}
                  className="mt-3 h-10 rounded-full"
                >
                  Catat Kawin Pertama
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {editOpen && (
        <StudBookingForm
          initial={booking}
          services={services}
          onClose={() => setEditOpen(false)}
          onSaved={async (updated) => {
            setBooking(updated);
            setEditOpen(false);
            router.refresh();
          }}
        />
      )}

      {matingOpen && (
        <MatingForm
          bookingId={booking.id}
          onClose={() => setMatingOpen(false)}
          onSaved={async () => {
            setMatingOpen(false);
            await reloadBooking();
            router.refresh();
          }}
        />
      )}

      {dueOpen && (
        <DueDateForm
          current={booking.expectedDueDate}
          manual={booking.expectedDueDateManual}
          onClose={() => setDueOpen(false)}
          onSave={async (payload) => {
            const success = await patchBooking(payload, "due");
            if (success) setDueOpen(false);
          }}
        />
      )}

      {deletingMating && (
        <ConfirmDialog
          title="Hapus Catatan Kawin?"
          description={`Catatan kawin ${formatDateID(deletingMating.matingDate)} akan dihapus. Jika ini kawin terakhir, status booking kembali ke Disetujui/Diminta dan estimasi lahir dikosongkan.`}
          busy={busy === "delete-mating"}
          error={error}
          onCancel={() => setDeletingMating(null)}
          onConfirm={deleteMating}
        />
      )}
    </div>
  );
}

function MatingForm({
  bookingId,
  onClose,
  onSaved,
}: {
  bookingId: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [matingDate, setMatingDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/stud-bookings/${bookingId}/matings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matingDate,
            notes: notes.trim() || null,
          }),
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
    <ModalShell title="Catat Kawin" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-xl bg-error-container p-3 text-sm text-error">
            {error}
          </p>
        )}
        <div className="space-y-1">
          <Label htmlFor="matingDate">Tanggal Kawin *</Label>
          <Input
            id="matingDate"
            type="date"
            value={matingDate}
            onChange={(event) => setMatingDate(event.target.value)}
            max={todayIso()}
            className="h-12 rounded-2xl border-sand-border"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="matingNotes">Catatan</Label>
          <Textarea
            id="matingNotes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="cth: kawin pertama, betina responsif"
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

function DueDateForm({
  current,
  manual,
  onClose,
  onSave,
}: {
  current: string | null;
  manual: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [date, setDate] = useState(current ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <ModalShell title="Ubah Estimasi Lahir" onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="expectedDue">Tanggal Estimasi</Label>
          <Input
            id="expectedDue"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-12 rounded-2xl border-sand-border"
          />
          <p className="text-xs text-text-muted">
            Saat ini {manual ? "diatur manual" : "dihitung otomatis"}.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            disabled={saving || !date}
            onClick={async () => {
              setSaving(true);
              await onSave({ expectedDueDate: date });
              setSaving(false);
            }}
            className="h-11 rounded-full"
          >
            Simpan Manual
          </Button>
          <Button
            variant="outline"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave({
                expectedDueDate: null,
                expectedDueDateManual: false,
              });
              setSaving(false);
            }}
            className="h-11 rounded-full"
          >
            Hitung Otomatis (Kawin + 65 Hari)
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
