"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateID, formatRupiah, getStudBookingsForUser, getStudServicesForUser, getStudService, getStudMatingsForBooking, daysUntil } from "@/lib/mock";
import type { StudBooking } from "@/types";

const STATUS_STYLE: Record<StudBooking["status"], { bg: string; text: string; label: string }> = {
  requested: { bg: "bg-amber-subtle", text: "text-honey-amber", label: "Diminta" },
  approved: { bg: "bg-lavender-subtle", text: "text-tertiary", label: "Disetujui" },
  ongoing: { bg: "bg-primary-container", text: "text-primary", label: "Berlangsung" },
  completed: { bg: "bg-mint-subtle", text: "text-secondary", label: "Selesai" },
  rejected: { bg: "bg-surface-container", text: "text-on-surface-variant", label: "Ditolak" },
  cancelled: { bg: "bg-surface-container", text: "text-on-surface-variant", label: "Dibatalkan" },
};

const FILTERS = ["semua", "requested", "approved", "ongoing", "completed"] as const;

export function StudBookingList() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudBooking | null>(null);
  const [deleting, setDeleting] = useState<StudBooking | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("semua");
  const [bookings, setBookings] = useState(() => getStudBookingsForUser("user-1"));

  const visible = bookings.filter((b) => (filter === "semua" ? true : b.status === filter));

  function updateStatus(id: string, status: StudBooking["status"]) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Booking Pacak</h3>
          <p className="text-sm text-text-muted">Kelola permintaan klien</p>
        </div>
        <Button onClick={() => setOpen(true)} className="h-10 rounded-full px-4">
          <span className="material-symbols-outlined mr-1 text-xl">add</span>
          Booking Baru
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
              filter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-surface-card text-text-muted shadow-sm"
            }`}
          >
            {f === "semua" ? "Semua" : STATUS_STYLE[f].label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-3xl text-text-muted">calendar_month</span>
            </div>
            <h4 className="font-bold text-on-surface">Belum Ada Booking</h4>
            <p className="mt-1 max-w-xs text-sm text-text-muted">
              Catat booking pertama dari klien yang menghubungimu via WhatsApp.
            </p>
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="mt-4 h-10 rounded-full px-4"
            >
              Buat Booking Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onUpdateStatus={updateStatus}
              onEdit={(b) => {
                setEditing(b);
                setOpen(true);
              }}
              onDelete={(b) => setDeleting(b)}
            />
          ))}
        </div>
      )}

      {open && (
        <StudBookingForm
          initial={editing}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSave={(data) => {
            if (editing) {
              setBookings((prev) => prev.map((b) => (b.id === editing.id ? { ...b, ...data, feeAgreed: data.feeAgreed ? parseInt(data.feeAgreed) : null, depositAmount: data.depositAmount ? parseInt(data.depositAmount) : null } : b)));
            } else {
              setBookings((prev) => [
                ...prev,
                {
                  id: `sb-${Date.now()}`,
                  ownerId: "user-1",
                  status: "requested",
                  expectedDueDate: null,
                  expectedDueDateManual: false,
                  queenPregnancyStatus: "unknown",
                  createdAt: new Date(),
                  feeAgreed: data.feeAgreed ? parseInt(data.feeAgreed) : null,
                  depositAmount: data.depositAmount ? parseInt(data.depositAmount) : null,
                  depositPaid: data.depositPaid,
                  studServiceId: data.studServiceId,
                  clientName: data.clientName,
                  clientWhatsapp: data.clientWhatsapp,
                  queenName: data.queenName,
                  queenBreed: data.queenBreed || null,
                  queenAgeText: data.queenAgeText || null,
                  plannedDate: data.plannedDate || null,
                  notes: data.notes || null,
                },
              ]);
            }
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus Booking?"
          desc={`Booking ${deleting.queenName} dari ${deleting.clientName} akan dihapus permanen.`}
          confirmLabel="Hapus"
          onConfirm={() => {
            setBookings((prev) => prev.filter((b) => b.id !== deleting.id));
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function BookingCard({
  booking,
  onUpdateStatus,
  onEdit,
  onDelete,
}: {
  booking: StudBooking;
  onUpdateStatus: (id: string, status: StudBooking["status"]) => void;
  onEdit: (b: StudBooking) => void;
  onDelete: (b: StudBooking) => void;
}) {
  const style = STATUS_STYLE[booking.status];
  const service = getStudService(booking.studServiceId);
  const matings = getStudMatingsForBooking(booking.id);
  const waText = encodeURIComponent(`Halo ${booking.clientName}, saya menghubungi terkait booking pacak ${booking.queenName} di cukingPro.`);
  const waUrl = `https://wa.me/${booking.clientWhatsapp.replace(/^0/, "62")}?text=${waText}`;

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-on-surface">{booking.queenName}</p>
              <Badge variant="outline" className={`${style.bg} ${style.text}`}>{style.label}</Badge>
            </div>
            <p className="text-sm text-text-muted">
              {booking.clientName} • {booking.clientWhatsapp}
            </p>
            {booking.queenBreed && (
              <p className="text-sm text-text-muted">{booking.queenBreed}{booking.queenAgeText ? ` • ${booking.queenAgeText}` : ""}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(booking)}
              aria-label="Edit"
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(booking)}
              aria-label="Hapus"
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-error-container hover:text-error"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-medium text-on-surface">
              {service?.catName ?? "-"}
            </p>
            {booking.plannedDate && (
              <p className="text-sm text-text-muted">{formatDateID(booking.plannedDate)}</p>
            )}
          </div>
        </div>

        {matings.length > 0 && (
          <div className="mt-3 rounded-2xl bg-surface-container-low p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-tertiary">favorite</span>
                <span className="text-sm font-semibold text-on-surface">
                  Kawin pertama: {formatDateID(matings[0].matingDate)} • Total kawin: {matings.length}×
                </span>
              </div>
            </div>
            {booking.expectedDueDate && (
              <p className="mt-1 text-sm text-error font-semibold">
                Estimasi lahir: {formatDateID(booking.expectedDueDate)} ({daysUntil(booking.expectedDueDate)} hari lagi)
              </p>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/jasa-pacak/booking/${booking.id}`}>
            <Button size="sm" className="h-8 rounded-full">Detail</Button>
          </Link>
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="h-8 rounded-full">
              <span className="material-symbols-outlined mr-1 text-base">chat</span>
              WhatsApp
            </Button>
          </a>
          {booking.status === "requested" && (
            <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => onUpdateStatus(booking.id, "approved")}>
              Setujui
            </Button>
          )}
          {booking.status === "approved" && (
            <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => onUpdateStatus(booking.id, "cancelled")}>
              Batalkan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StudBookingFormProps {
  initial: StudBooking | null;
  onClose: () => void;
  onSave: (data: {
    studServiceId: string;
    clientName: string;
    clientWhatsapp: string;
    queenName: string;
    queenBreed: string;
    queenAgeText: string;
    plannedDate: string;
    feeAgreed: string;
    depositAmount: string;
    depositPaid: boolean;
    notes: string;
  }) => void;
}
function StudBookingForm({ initial, onClose, onSave }: StudBookingFormProps) {
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [clientWhatsapp, setClientWhatsapp] = useState(initial?.clientWhatsapp ?? "");
  const [queenName, setQueenName] = useState(initial?.queenName ?? "");
  const [queenBreed, setQueenBreed] = useState(initial?.queenBreed ?? "");
  const [queenAgeText, setQueenAgeText] = useState(initial?.queenAgeText ?? "");
  const [plannedDate, setPlannedDate] = useState(initial?.plannedDate ?? "");
  const [studServiceId, setStudServiceId] = useState(initial?.studServiceId ?? "");
  const [feeAgreed, setFeeAgreed] = useState(initial?.feeAgreed?.toString() ?? "");
  const [depositAmount, setDepositAmount] = useState(initial?.depositAmount?.toString() ?? "");
  const [depositPaid, setDepositPaid] = useState(initial?.depositPaid ?? false);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const services = getStudServicesForUser("user-1").filter((s) => s.isAvailable);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!clientName.trim()) nextErrors.clientName = "Nama klien wajib diisi";
    if (!clientWhatsapp.trim()) nextErrors.clientWhatsapp = "WhatsApp klien wajib diisi";
    if (!studServiceId) nextErrors.studServiceId = "Pilih pejantan";
    if (!queenName.trim()) nextErrors.queenName = "Nama betina wajib diisi";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    // TODO: POST /api/stud-bookings atau PATCH /api/stud-bookings/:id
    onSave({
      studServiceId,
      clientName,
      clientWhatsapp,
      queenName,
      queenBreed,
      queenAgeText,
      plannedDate,
      feeAgreed,
      depositAmount,
      depositPaid,
      notes,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">{initial ? "Edit Booking" : "Booking Baru"}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="studServiceId">Pejantan *</Label>
            <select id="studServiceId" value={studServiceId} onChange={(e) => setStudServiceId(e.target.value)} className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-sm">
              <option value="">Pilih pejantan</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.catName}{s.feeAmount ? ` — ${formatRupiah(s.feeAmount)}` : ""}</option>
              ))}
            </select>
            {errors.studServiceId && <p className="text-sm text-error">{errors.studServiceId}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="clientName">Nama Klien *</Label>
            <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="cth: Dian Pratama" className="h-12 rounded-2xl border-sand-border" />
            {errors.clientName && <p className="text-sm text-error">{errors.clientName}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="clientWhatsapp">WhatsApp Klien *</Label>
            <Input id="clientWhatsapp" value={clientWhatsapp} onChange={(e) => setClientWhatsapp(e.target.value)} placeholder="08xxxxxxxxxx" className="h-12 rounded-2xl border-sand-border" />
            {errors.clientWhatsapp && <p className="text-sm text-error">{errors.clientWhatsapp}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="queenName">Nama Betina *</Label>
            <Input id="queenName" value={queenName} onChange={(e) => setQueenName(e.target.value)} placeholder="cth: Bella" className="h-12 rounded-2xl border-sand-border" />
            {errors.queenName && <p className="text-sm text-error">{errors.queenName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="queenBreed">Ras Betina</Label>
              <Input id="queenBreed" value={queenBreed} onChange={(e) => setQueenBreed(e.target.value)} placeholder="cth: Persia" className="h-12 rounded-2xl border-sand-border" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="queenAgeText">Umur Betina</Label>
              <Input id="queenAgeText" value={queenAgeText} onChange={(e) => setQueenAgeText(e.target.value)} placeholder="cth: 1,5 tahun" className="h-12 rounded-2xl border-sand-border" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="plannedDate">Tanggal Rencana (opsional)</Label>
            <Input id="plannedDate" type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} className="h-12 rounded-2xl border-sand-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="feeAgreed">Tarif Disepakati (Rp)</Label>
              <Input id="feeAgreed" type="number" min={0} step={100000} value={feeAgreed} onChange={(e) => setFeeAgreed(e.target.value)} placeholder="cth: 3000000" className="h-12 rounded-2xl border-sand-border" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="depositAmount">DP (Rp)</Label>
              <Input id="depositAmount" type="number" min={0} step={100000} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="cth: 500000" className="h-12 rounded-2xl border-sand-border" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="depositPaid" checked={depositPaid} onChange={(e) => setDepositPaid(e.target.checked)} className="h-4 w-4 rounded border-sand-border text-primary" />
            <Label htmlFor="depositPaid" className="cursor-pointer">DP sudah dibayar</Label>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Catatan</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan khusus" className="h-12 rounded-2xl border-sand-border" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-12 flex-1 rounded-full">Batal</Button>
            <Button type="submit" className="h-12 flex-1 rounded-full">
              {initial ? "Simpan Perubahan" : "Simpan (Status: Diminta)"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  desc,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  desc: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
        <h3 className="font-bold text-on-surface">{title}</h3>
        <p className="mt-2 text-sm text-on-surface-variant">{desc}</p>
        <div className="mt-6 flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="h-12 flex-1 rounded-full">Batal</Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="h-12 flex-1 rounded-full bg-error text-white hover:bg-error/90"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}