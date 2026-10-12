"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateID, daysUntil, getStudBooking, getStudMatingsForBooking, getStudService } from "@/lib/mock";
import type { StudBooking } from "@/types";

interface BookingDetailProps {
  params: Promise<{ id: string }>;
}

export default function BookingDetailPage({ params }: BookingDetailProps) {
  const [booking, setBooking] = useState<StudBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      setBooking(getStudBooking(id) ?? null);
      setLoading(false);
    });
  }, [params]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border-sand-border bg-surface-card p-8 text-center shadow-warm-sm">
          <p className="font-bold text-on-surface">Booking tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/jasa-pacak" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Jasa Pacak
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">Booking: {booking.queenName}</h1>
        <p className="mt-1 text-text-muted">{booking.clientName} • {booking.clientWhatsapp}</p>
      </div>

      <BookingDetail booking={booking} />
    </div>
  );
}

function BookingDetail({ booking }: { booking: StudBooking }) {
  const [showMatingForm, setShowMatingForm] = useState(false);
  const [matings, setMatings] = useState(() => getStudMatingsForBooking(booking.id));
  const [matingDate, setMatingDate] = useState("");
  const [matingNotes, setMatingNotes] = useState("");
  const [matingError, setMatingError] = useState("");

  const service = getStudService(booking.studServiceId);
  const firstMating = matings[0];

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function handleAddMating(e: React.FormEvent) {
    e.preventDefault();
    if (!matingDate) {
      setMatingError("Tanggal kawin wajib diisi");
      return;
    }
    if (matingDate > todayStr()) {
      setMatingError("Tanggal kawin tidak boleh di masa depan");
      return;
    }
    setMatingError("");
    // TODO: POST /api/stud-bookings/:id/matings
    const isEarlier = firstMating && matingDate < firstMating.matingDate;
    const newFirst = isEarlier ? matingDate : firstMating?.matingDate;
    setMatings((prev) => [...prev, { id: `sm-${Date.now()}`, bookingId: booking.id, matingDate, notes: matingNotes }].sort((a, b) => a.matingDate.localeCompare(b.matingDate)));
    setMatingDate("");
    setMatingNotes("");
    setShowMatingForm(false);
  }

  const queenStatusOptions: { value: StudBooking["queenPregnancyStatus"]; label: string }[] = [
    { value: "unknown", label: "Belum diketahui" },
    { value: "pregnant", label: "Hamil" },
    { value: "not_pregnant", label: "Tidak hamil" },
    { value: "delivered", label: "Sudah melahirkan" },
  ];

  return (
    <div className="space-y-4">
      {/* Ringkasan */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Ringkasan Booking</CardTitle>
              <CardDescription>Pejantan: {service?.catName ?? "-"}</CardDescription>
            </div>
            <Badge className="rounded-full bg-primary-container text-primary">{booking.status === "ongoing" ? "Berlangsung" : booking.status === "approved" ? "Disetujui" : "Diminta"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-surface-container-low p-3">
              <p className="text-xs text-text-muted">Betina Klien</p>
              <p className="font-bold text-on-surface">{booking.queenName}</p>
              {booking.queenBreed && <p className="text-sm text-text-muted">{booking.queenBreed}</p>}
            </div>
            <div className="rounded-2xl bg-surface-container-low p-3">
              <p className="text-xs text-text-muted">Tanggal Rencana</p>
              <p className="font-bold text-on-surface">{booking.plannedDate ? formatDateID(booking.plannedDate) : "Belum ditentukan"}</p>
            </div>
          </div>

          {booking.feeAgreed && (
            <div className="flex items-center justify-between rounded-2xl bg-surface-container-low p-3">
              <div>
                <p className="text-xs text-text-muted">Tarif Disepakati</p>
                <p className="font-bold text-on-surface">Rp{booking.feeAgreed.toLocaleString("id-ID")}</p>
              </div>
              {booking.depositAmount && (
                <div className="text-right">
                  <p className="text-xs text-text-muted">DP</p>
                  <p className="font-semibold text-on-surface">
                    Rp{booking.depositAmount.toLocaleString("id-ID")} {booking.depositPaid ? "(Lunas)" : "(Belum)"}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistik Kawin */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Catatan Kawin</CardTitle>
              <CardDescription>Kawin pertama, jumlah kawin, estimasi lahir</CardDescription>
            </div>
            <Button onClick={() => setShowMatingForm(true)} size="sm" className="h-9 rounded-full">
              <span className="material-symbols-outlined mr-1 text-lg">add</span>
              Catat Kawin
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {matings.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-lavender-subtle p-3 text-center">
                  <p className="text-lg font-bold text-tertiary">{firstMating ? formatDateID(firstMating.matingDate) : "-"}</p>
                  <p className="text-xs text-text-muted">Kawin Pertama</p>
                </div>
                <div className="rounded-2xl bg-tangerine-subtle p-3 text-center">
                  <p className="text-lg font-bold text-primary">{matings.length}×</p>
                  <p className="text-xs text-text-muted">Total Kawin</p>
                </div>
                <div className="rounded-2xl bg-error-container/30 p-3 text-center">
                  <p className="text-lg font-bold text-error">
                    {firstMating ? formatDateID(new Date(new Date(firstMating.matingDate + "T00:00:00").getTime() + 65 * 86400000).toISOString().slice(0, 10)) : "-"}
                  </p>
                  <p className="text-xs text-text-muted">Estimasi Lahir</p>
                </div>
              </div>
              {firstMating && (
                <p className="text-sm text-text-muted">
                  {daysUntil(new Date(new Date(firstMating.matingDate + "T00:00:00").getTime() + 65 * 86400000).toISOString().slice(0, 10)) > 0
                    ? `${daysUntil(new Date(new Date(firstMating.matingDate + "T00:00:00").getTime() + 65 * 86400000).toISOString().slice(0, 10))} hari lagi`
                    : "Sudah melewati estimasi"}
                </p>
              )}

              {/* Status kehamilan */}
              <div className="rounded-2xl bg-surface-container-low p-3">
                <p className="text-xs font-semibold text-text-muted">Status Kehamilan Betina</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {queenStatusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                        booking.queenPregnancyStatus === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-card text-text-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Riwayat kawin */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-on-surface">Riwayat Kawin</p>
                {matings.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between rounded-2xl bg-surface-container-low p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lavender-subtle text-sm font-bold text-tertiary">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{formatDateID(m.matingDate)}</p>
                        {m.notes && <p className="text-xs text-text-muted">{m.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-surface-container-low p-6 text-center">
              <p className="font-semibold text-on-surface">Belum ada kawin tercatat</p>
              <p className="mt-1 text-sm text-text-muted">Catat kawin pertama untuk mengaktifkan estimasi lahir</p>
              <Button onClick={() => setShowMatingForm(true)} className="mt-3 h-10 rounded-full">
                <span className="material-symbols-outlined mr-1 text-lg">add</span>
                Catat Kawin Pertama
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal catat kawin */}
      {showMatingForm && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-on-surface">Catat Kawin</h3>
              <button onClick={() => setShowMatingForm(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <form onSubmit={handleAddMating} className="mt-4 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="matingDate">Tanggal Kawin *</Label>
                <Input
                  id="matingDate"
                  type="date"
                  value={matingDate}
                  onChange={(e) => setMatingDate(e.target.value)}
                  max={todayStr()}
                  className="h-12 rounded-2xl border-sand-border"
                />
                {matingError && <p className="text-sm text-error">{matingError}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="matingNotes">Catatan</Label>
                <Textarea
                  id="matingNotes"
                  value={matingNotes}
                  onChange={(e) => setMatingNotes(e.target.value)}
                  rows={3}
                  placeholder="cth: kawin pertama, betina responsif"
                  className="rounded-2xl border-sand-border"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowMatingForm(false)} className="h-12 flex-1 rounded-full">Batal</Button>
                <Button type="submit" className="h-12 flex-1 rounded-full">Simpan</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}