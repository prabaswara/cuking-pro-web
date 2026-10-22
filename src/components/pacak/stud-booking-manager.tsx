"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateID, daysUntil } from "@/lib/date";
import type { StudBookingWithDetails } from "@/lib/stud-bookings";
import type { StudBookingStatus } from "@/lib/validation/stud";
import {
  readApiError,
  STUD_BOOKING_STATUS_STYLE,
  whatsappUrl,
} from "@/components/pacak/stud-status";
import {
  ConfirmDialog,
} from "@/components/pacak/stud-service-manager";
import {
  StudBookingForm,
  type StudServiceOption,
} from "@/components/pacak/stud-booking-form";

type BookingSlice = {
  items: StudBookingWithDetails[];
  lockedCount: number;
  windowStart: string | null;
};

type Filter = "semua" | StudBookingStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "requested", label: "Diminta" },
  { value: "approved", label: "Disetujui" },
  { value: "ongoing", label: "Berlangsung" },
  { value: "completed", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
  { value: "cancelled", label: "Dibatalkan" },
];

export function StudBookingManager({
  initial,
  services,
}: {
  initial: BookingSlice;
  services: StudServiceOption[];
}) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initial.items);
  const [lockedCount, setLockedCount] = useState(initial.lockedCount);
  const [filter, setFilter] = useState<Filter>("semua");
  const [serviceFilter, setServiceFilter] = useState("semua");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudBookingWithDetails | null>(null);
  const [deleting, setDeleting] = useState<StudBookingWithDetails | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          (filter === "semua" || booking.status === filter) &&
          (serviceFilter === "semua" ||
            booking.studServiceId === serviceFilter),
      ),
    [bookings, filter, serviceFilter],
  );

  const activeCount = bookings.filter((booking) =>
    ["requested", "approved", "ongoing"].includes(booking.status),
  ).length;

  async function reload() {
    const response = await fetch("/api/stud-bookings");
    const data = await response.json().catch(() => null);
    if (response.ok) {
      const slice = data as BookingSlice;
      setBookings(slice.items);
      setLockedCount(slice.lockedCount);
    }
  }

  async function updateStatus(
    booking: StudBookingWithDetails,
    status: StudBookingStatus,
  ) {
    setBusyId(booking.id);
    setError(null);

    try {
      const response = await fetch(`/api/stud-bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return;
      }

      const updated = (data as { booking: StudBookingWithDetails }).booking;
      setBookings((prev) =>
        prev.map((item) => (item.id === booking.id ? updated : item)),
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
      const response = await fetch(`/api/stud-bookings/${deleting.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(readApiError(data));
        return;
      }

      setBookings((prev) => prev.filter((item) => item.id !== deleting.id));
      setDeleting(null);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Booking Pacak</h3>
          <p className="text-sm text-text-muted">
            {activeCount} booking aktif • kelola permintaan klien
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setError(null);
            setOpen(true);
          }}
          disabled={!services.some((service) => service.isBookable)}
          className="h-10 rounded-full px-4"
        >
          <span className="material-symbols-outlined mr-1 text-xl">add</span>
          Booking Baru
        </Button>
      </div>

      {error && !open && !deleting && (
        <p className="rounded-xl bg-error-container p-3 text-sm text-error">
          {error}
        </p>
      )}

      {lockedCount > 0 && initial.windowStart && (
        <p className="rounded-2xl border border-amber-subtle bg-amber-subtle/40 p-3 text-sm text-honey-amber">
          {lockedCount} booking lama terkunci di paket Free (sebelum{" "}
          {formatDateID(initial.windowStart)}).
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <select
          value={serviceFilter}
          onChange={(event) => setServiceFilter(event.target.value)}
          className="h-9 rounded-full border border-sand-border bg-surface-card px-3 text-sm"
        >
          <option value="semua">Semua pejantan</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.catName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
              filter === item.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface-card text-text-muted shadow-sm"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-3xl text-text-muted">
                calendar_month
              </span>
            </div>
            <h4 className="font-bold text-on-surface">Belum Ada Booking</h4>
            <p className="mt-1 max-w-xs text-sm text-text-muted">
              Catat booking pertama dari klien yang menghubungimu via
              WhatsApp.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((booking) => {
            const style = STUD_BOOKING_STATUS_STYLE[booking.status];
            const wa = whatsappUrl(
              booking.clientWhatsapp,
              `Halo ${booking.clientName}, saya menghubungi terkait booking pacak ${booking.queenName} di cukingPro.`,
            );

            return (
              <Card
                key={booking.id}
                className="rounded-3xl border-sand-border shadow-warm-sm"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-bold text-on-surface">
                          {booking.queenName}
                        </p>
                        <Badge
                          variant="outline"
                          className={`${style.bg} ${style.text}`}
                        >
                          {style.label}
                        </Badge>
                        {booking.isOverdue && (
                          <Badge
                            variant="outline"
                            className="bg-error-container text-error"
                          >
                            Melewati estimasi lahir
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-text-muted">
                        {booking.clientName} • {booking.clientWhatsapp}
                      </p>
                      <p className="truncate text-sm text-text-muted">
                        {[
                          booking.service.catName,
                          booking.queenBreed,
                          booking.queenAgeText,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-text-muted">
                        Rencana
                      </p>
                      <p className="text-sm font-medium text-on-surface">
                        {booking.plannedDate
                          ? formatDateID(booking.plannedDate)
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {booking.matingCount > 0 && (
                    <div className="rounded-2xl bg-surface-container-low p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-on-surface">
                          Kawin pertama:{" "}
                          {formatDateID(booking.firstMatingDate)} •{" "}
                          {booking.matingCount}×
                        </p>
                        {booking.expectedDueDate && (
                          <p className="text-sm font-semibold text-error">
                            Estimasi lahir:{" "}
                            {formatDateID(booking.expectedDueDate)} (
                            {daysUntil(booking.expectedDueDate)} hari)
                          </p>
                        )}
                      </div>
                      {booking.isOverdue && (
                        <Link
                          href={`/jasa-pacak/booking/${booking.id}`}
                          className="mt-2 inline-flex text-sm font-semibold text-primary underline"
                        >
                          Perbarui status
                        </Link>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/jasa-pacak/booking/${booking.id}`}>
                      <Button size="sm" className="h-8 rounded-full">
                        Detail
                      </Button>
                    </Link>
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full"
                      >
                        <span className="material-symbols-outlined mr-1 text-base">
                          chat
                        </span>
                        WhatsApp
                      </Button>
                    </a>
                    {booking.status === "requested" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full"
                        onClick={() => updateStatus(booking, "approved")}
                        disabled={busyId === booking.id}
                      >
                        Setujui
                      </Button>
                    )}
                    {booking.status === "ongoing" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full"
                        onClick={() => updateStatus(booking, "completed")}
                        disabled={busyId === booking.id || booking.matingCount === 0}
                      >
                        Selesaikan
                      </Button>
                    )}
                    {["requested", "approved", "ongoing"].includes(
                      booking.status,
                    ) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full"
                        onClick={() => updateStatus(booking, "cancelled")}
                        disabled={busyId === booking.id}
                      >
                        Batalkan
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full"
                      onClick={() => {
                        setEditing(booking);
                        setError(null);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full text-error"
                      onClick={() => {
                        setError(null);
                        setDeleting(booking);
                      }}
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {open && (
        <StudBookingForm
          key={editing?.id ?? "new"}
          initial={editing}
          services={services}
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
          title="Hapus Booking?"
          description={`Booking ${deleting.queenName} dari ${deleting.clientName} beserta catatan kawinnya akan dihapus permanen.`}
          busy={busyId === deleting.id}
          error={error}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
