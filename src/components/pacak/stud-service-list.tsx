"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, getStudServicesForUser, mockCats } from "@/lib/mock";
import type { StudService } from "@/types";

const STATUS_STYLE = {
  available: { bg: "bg-mint-subtle", text: "text-secondary", label: "Tersedia" },
  unavailable: { bg: "bg-surface-container", text: "text-on-surface-variant", label: "Tidak Tersedia" },
};

export function StudServiceList() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudService | null>(null);
  const [deleting, setDeleting] = useState<StudService | null>(null);
  const [services, setServices] = useState(() => getStudServicesForUser("user-1"));

  const availableCount = services.filter((s) => s.isAvailable).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Pejantan Pacak</h3>
          <p className="text-sm text-text-muted">{availableCount} tersedia dari {services.length}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="h-10 rounded-full px-4"
        >
          <span className="material-symbols-outlined mr-1 text-xl">add</span>
          Tambah Pejantan
        </Button>
      </div>

      {services.length === 0 ? (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-3xl text-text-muted">cruelty_free</span>
            </div>
            <h4 className="font-bold text-on-surface">Belum Ada Pejantan Pacak</h4>
            <p className="mt-1 max-w-xs text-sm text-text-muted">
              Daftarkan kucing jantanmu sebagai pejantan pacak untuk menerima booking.
            </p>
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="mt-4 h-10 rounded-full px-4"
            >
              Tambah Pejantan Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <StudServiceCard
              key={service.id}
              service={service}
              onToggle={(id, available) => {
                setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isAvailable: available } : s)));
              }}
              onEdit={(s) => {
                setEditing(s);
                setOpen(true);
              }}
              onDelete={(s) => setDeleting(s)}
            />
          ))}
        </div>
      )}

      {open && (
        <StudServiceForm
          initial={editing}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSave={(data) => {
            if (editing) {
              setServices((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...data } : s)));
            } else {
              setServices((prev) => [
                ...prev,
                { id: `ss-${Date.now()}`, ownerId: "user-1", isAvailable: true, ...data },
              ]);
            }
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus Pejantan Pacak?"
          desc={`"${deleting.catName}" akan dihapus dari daftar pejantan pacak.`}
          confirmLabel="Hapus"
          onConfirm={() => {
            setServices((prev) => prev.filter((s) => s.id !== deleting.id));
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function StudServiceCard({
  service,
  onToggle,
  onEdit,
  onDelete,
}: {
  service: StudService;
  onToggle: (id: string, available: boolean) => void;
  onEdit: (s: StudService) => void;
  onDelete: (s: StudService) => void;
}) {
  const style = service.isAvailable ? STATUS_STYLE.available : STATUS_STYLE.unavailable;
  const cat = service.catId ? mockCats.find((c) => c.id === service.catId) : null;

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-lavender-subtle text-tertiary">
              <span className="material-symbols-outlined text-2xl">cruelty_free</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-on-surface truncate">{service.catName}</p>
                <Badge variant="outline" className={`${style.bg} ${style.text}`}>
                  {style.label}
                </Badge>
              </div>
              {cat && <p className="text-sm text-text-muted">{cat.breed} • {cat.color}</p>}
              <div className="mt-1 flex items-center gap-2">
                {service.feeAmount ? (
                  <span className="text-sm font-bold text-on-surface">{formatRupiah(service.feeAmount)}</span>
                ) : (
                  <span className="text-sm font-medium text-on-surface-variant italic">{service.feeDescription}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(service)}
              aria-label="Edit"
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(service)}
              aria-label="Hapus"
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-error-container hover:text-error"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
            <Switch checked={service.isAvailable} onCheckedChange={(v) => onToggle(service.id, v)} />
          </div>
        </div>
        {service.notes && (
          <p className="mt-2 rounded-2xl bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
            {service.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface StudServiceFormProps {
  initial: StudService | null;
  onClose: () => void;
  onSave: (data: { catId: string; catName: string; feeAmount: number | null; feeDescription: string | null; notes: string | null }) => void;
}

function StudServiceForm({ initial, onClose, onSave }: StudServiceFormProps) {
  const [catId, setCatId] = useState(initial?.catId ?? "");
  const [feeType, setFeeType] = useState<"nominal" | "deskripsi">(
    initial ? (initial.feeAmount != null ? "nominal" : "deskripsi") : "nominal"
  );
  const [feeAmount, setFeeAmount] = useState(initial?.feeAmount?.toString() ?? "");
  const [feeDescription, setFeeDescription] = useState(initial?.feeDescription ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const eligibleMales = mockCats.filter((c) => c.sex === "male" && c.status === "active" && c.trackingStatus === "tracked");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!catId) nextErrors.catId = "Pilih pejantan";
    if (feeType === "nominal" && (!feeAmount || parseInt(feeAmount) < 0)) {
      nextErrors.feeAmount = "Tarif tidak boleh negatif";
    }
    if (feeType === "deskripsi" && !feeDescription.trim()) {
      nextErrors.feeDescription = "Isi deskripsi tarif";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    // TODO: POST /api/stud-services atau PATCH /api/stud-services/:id
    const cat = eligibleMales.find((c) => c.id === catId);
    onSave({
      catId,
      catName: cat?.name ?? "",
      feeAmount: feeType === "nominal" ? parseInt(feeAmount) : null,
      feeDescription: feeType === "deskripsi" ? feeDescription : null,
      notes: notes.trim() || null,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">{initial ? "Edit Pejantan Pacak" : "Tambah Pejantan Pacak"}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="catId">Pejantan *</Label>
            <select
              id="catId"
              value={catId}
              onChange={(e) => setCatId(e.target.value)}
              className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-sm"
              disabled={!!initial}
            >
              <option value="">Pilih pejantan</option>
              {eligibleMales.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.breed})</option>
              ))}
            </select>
            {errors.catId && <p className="text-sm text-error">{errors.catId}</p>}
          </div>

          <div className="space-y-1">
            <Label>Jenis Tarif</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFeeType("nominal")} className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${feeType === "nominal" ? "border-primary bg-tangerine-subtle text-primary" : "border-sand-border bg-surface-card text-on-surface"}`}>
                Nominal (Rp)
              </button>
              <button type="button" onClick={() => setFeeType("deskripsi")} className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${feeType === "deskripsi" ? "border-primary bg-tangerine-subtle text-primary" : "border-sand-border bg-surface-card text-on-surface"}`}>
                Deskripsi
              </button>
            </div>
          </div>

          {feeType === "nominal" ? (
            <div className="space-y-1">
              <Label htmlFor="feeAmount">Tarif (Rp)</Label>
              <Input id="feeAmount" type="number" min={0} step={100000} value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} placeholder="cth: 3000000" className="h-12 rounded-2xl border-sand-border" />
              {errors.feeAmount && <p className="text-sm text-error">{errors.feeAmount}</p>}
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="feeDescription">Deskripsi Tarif</Label>
              <Input id="feeDescription" value={feeDescription} onChange={(e) => setFeeDescription(e.target.value)} placeholder="cth: anak pilihan pertama" className="h-12 rounded-2xl border-sand-border" />
              {errors.feeDescription && <p className="text-sm text-error">{errors.feeDescription}</p>}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="notes">Catatan</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="cth: pengalaman kawin, pedigree, dll." className="h-12 rounded-2xl border-sand-border" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-12 flex-1 rounded-full">Batal</Button>
            <Button type="submit" className="h-12 flex-1 rounded-full">Simpan</Button>
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