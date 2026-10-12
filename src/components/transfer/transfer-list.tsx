"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateID, daysUntil, getTransfersForUser, getCatName, mockCats, getOwnershipHistory } from "@/lib/mock";
import type { CatTransfer } from "@/types";

const STATUS_STYLE: Record<CatTransfer["status"], { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-subtle", text: "text-honey-amber", label: "Menunggu" },
  accepted: { bg: "bg-mint-subtle", text: "text-secondary", label: "Diterima" },
  rejected: { bg: "bg-surface-container", text: "text-on-surface-variant", label: "Ditolak" },
  cancelled: { bg: "bg-surface-container", text: "text-on-surface-variant", label: "Dibatalkan" },
  expired: { bg: "bg-surface-container", text: "text-on-surface-variant", label: "Kedaluwarsa" },
};

const TRANSFERRED_NOTE = "Ikut pindah: profil kucing (foto, catatan), riwayat kesehatan & berat, riwayat birahi, riwayat kepemilikan. Tetap milik pengirim: catatan kawin & kelahiran, penjualan, booking pacak, transaksi, pengingat. Tidak ada relasi lintas pemilik.";

export function TransferList() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"semua" | "pending" | "selesai">("semua");
  const [transfers, setTransfers] = useState(() => getTransfersForUser("user-1"));

  const visible = transfers.filter((t) => {
    if (filter === "semua") return true;
    if (filter === "pending") return t.status === "pending";
    return t.status !== "pending";
  });

  function updateStatus(id: string, status: CatTransfer["status"]) {
    setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Transfer Kepemilikan</h3>
          <p className="text-sm text-text-muted">Permintaan transfer kucing masuk & keluar</p>
        </div>
        <Button onClick={() => setOpen(true)} className="h-10 rounded-full px-4">
          <span className="material-symbols-outlined mr-1 text-xl">add</span>
          Transfer Baru
        </Button>
      </div>

      <div className="flex gap-2">
        {(["semua", "pending", "selesai"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
              filter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-surface-card text-text-muted shadow-sm"
            }`}
          >
            {f === "semua" ? "Semua" : f === "pending" ? "Menunggu" : "Selesai"}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-3xl text-text-muted">swap_horiz</span>
            </div>
            <h4 className="font-bold text-on-surface">Belum Ada Transfer</h4>
            <p className="mt-1 max-w-xs text-sm text-text-muted">
              Permintaan transfer kucing yang kamu kirim atau terima akan muncul di sini.
            </p>
            <Button onClick={() => setOpen(true)} className="mt-4 h-10 rounded-full px-4">Buat Transfer Pertama</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((transfer) => (
            <TransferCard key={transfer.id} transfer={transfer} onUpdateStatus={updateStatus} />
          ))}
        </div>
      )}

      {open && <TransferForm onClose={() => setOpen(false)} />}
    </div>
  );
}

function TransferCard({ transfer, onUpdateStatus }: { transfer: CatTransfer; onUpdateStatus: (id: string, status: CatTransfer["status"]) => void }) {
  const style = STATUS_STYLE[transfer.status];
  const isOutgoing = transfer.fromUserId === "user-1";
  const canRespond = transfer.status === "pending" && !isOutgoing;
  const canCancel = transfer.status === "pending" && isOutgoing;

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-on-surface">{transfer.catName}</p>
              <Badge variant="outline" className={`${style.bg} ${style.text}`}>{style.label}</Badge>
            </div>
            <p className="text-sm text-text-muted">
              {isOutgoing ? `Ke: ${transfer.toEmail}` : `Dari: pengguna lain`}
            </p>
            <p className="text-sm text-text-muted">
              Dibuat {formatDateID(transfer.createdAt.toISOString())}
              {transfer.status === "pending" && ` • ${daysUntil(transfer.expiresAt.toISOString())} hari lagi`}
            </p>
          </div>
        </div>

        {transfer.message && (
          <p className="mt-2 rounded-2xl bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
            &ldquo;{transfer.message}&rdquo;
          </p>
        )}

        <p className="mt-2 text-xs text-text-muted">{TRANSFERRED_NOTE}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {canRespond && (
            <>
              <Button size="sm" className="h-8 rounded-full" onClick={() => onUpdateStatus(transfer.id, "accepted")}>
                Terima
              </Button>
              <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => onUpdateStatus(transfer.id, "rejected")}>
                Tolak
              </Button>
            </>
          )}
          {canCancel && (
            <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => onUpdateStatus(transfer.id, "cancelled")}>
              Batalkan Permintaan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TransferFormProps {
  onClose: () => void;
}

function TransferForm({ onClose }: TransferFormProps) {
  const [catId, setCatId] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const eligibleCats = mockCats.filter((c) => c.status === "active" && c.trackingStatus === "tracked");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!catId) nextErrors.catId = "Pilih kucing";
    if (!toEmail.trim()) nextErrors.toEmail = "Email penerima wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail.trim())) nextErrors.toEmail = "Format email tidak valid";
    else if (toEmail.trim().toLowerCase() === "user@example.com") nextErrors.toEmail = "Tidak bisa mentransfer ke diri sendiri";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    // TODO: POST /api/cats/:id/transfers
    onClose();
  }

  const selectedCat = mockCats.find((c) => c.id === catId);

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">Transfer Kepemilikan</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="catId">Kucing *</Label>
            <select id="catId" value={catId} onChange={(e) => setCatId(e.target.value)} className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-sm">
              <option value="">Pilih kucing</option>
              {eligibleCats.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.breed})</option>
              ))}
            </select>
            {errors.catId && <p className="text-sm text-error">{errors.catId}</p>}
            {selectedCat && (
              <p className="text-xs text-text-muted">
                Riwayat kepemilikan saat ini: {getOwnershipHistory(selectedCat.id).map((o) => o.ownerDisplayName).join(", ")}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="toEmail">Email Penerima *</Label>
            <Input id="toEmail" type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} placeholder="nama@email.com" className="h-12 rounded-2xl border-sand-border" />
            {errors.toEmail && <p className="text-sm text-error">{errors.toEmail}</p>}
            <p className="text-xs text-text-muted">
              Penerima harus punya akun cukingPro dengan email terverifikasi yang sama.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="message">Pesan (opsional)</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="cth: sudah vaksin lengkap, buku registrasi diserahkan" className="rounded-2xl border-sand-border" />
          </div>

          <div className="rounded-2xl bg-surface-container-low p-3 text-xs text-text-muted">
            <p className="font-semibold text-on-surface">Yang ikut pindah:</p>
            <p>Profil kucing, riwayat kesehatan & berat, riwayat birahi, riwayat kepemilikan.</p>
            <p className="mt-1 font-semibold text-on-surface">Tetap milik pengirim:</p>
            <p>Catatan kawin & kelahiran, penjualan, booking pacak, transaksi, pengingat.</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-12 flex-1 rounded-full">Batal</Button>
            <Button type="submit" className="h-12 flex-1 rounded-full">Kirim Permintaan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}