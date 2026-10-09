"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCatName } from "@/lib/mock";

const JENIS_OPTIONS = [
  { value: "vaccine", label: "Vaksin", icon: "vaccines" },
  { value: "deworming", label: "Obat Cacing", icon: "medication" },
  { value: "flea", label: "Obat Kutu", icon: "pest_control" },
  { value: "vet_visit", label: "Kunjungan Dokter", icon: "stethoscope" },
  { value: "medication", label: "Pengobatan", icon: "pill" },
  { value: "other", label: "Lainnya", icon: "description" },
] as const;

interface HealthFormProps {
  catId: string;
}

export function HealthForm({ catId }: HealthFormProps) {
  const router = useRouter();
  const catName = getCatName(catId);
  const [jenis, setJenis] = useState<string>("vaccine");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  function todayStr(): string {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${m}-${d}`;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const recordDate = (formData.get("recordDate") as string) || "";
    const nextDueDate = (formData.get("nextDueDate") as string) || "";
    const nextErrors: Record<string, string> = {};

    if (!recordDate) {
      nextErrors.recordDate = "Tanggal catatan wajib diisi";
    } else if (recordDate > todayStr()) {
      nextErrors.recordDate = "Tanggal tidak boleh di masa depan";
    }
    if (nextDueDate && recordDate && nextDueDate < recordDate) {
      nextErrors.nextDueDate =
        "Tanggal berikutnya tidak boleh sebelum tanggal catatan";
    }
    if (!jenis) {
      nextErrors.jenis = "Pilih jenis catatan";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    // TODO: POST /api/cats/:id/health (dengan Zod di server)
    await new Promise((resolve) => setTimeout(resolve, 800));
    router.push(`/kucing/${catId}/kesehatan`);
  }

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardHeader>
        <CardTitle className="text-lg">Catatan Baru</CardTitle>
        <CardDescription>
          Pengingat otomatis dibuat bila tanggal berikutnya diisi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {/* Jenis */}
          <div className="space-y-2">
            <Label>
              Jenis Catatan <span className="text-primary">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {JENIS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setJenis(opt.value)}
                  aria-pressed={jenis === opt.value}
                  className={`flex items-center gap-2 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.98] ${
                    jenis === opt.value
                      ? "border-primary bg-tangerine-subtle text-primary shadow-sm"
                      : "border-sand-border bg-surface-card text-on-surface hover:border-primary/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {opt.icon}
                  </span>
                  <span className="text-sm font-semibold">{opt.label}</span>
                  {jenis === opt.value && (
                    <span className="material-symbols-outlined ml-auto text-lg">
                      check_circle
                    </span>
                  )}
                </button>
              ))}
            </div>
            {errors.jenis && (
              <p className="text-sm text-error">{errors.jenis}</p>
            )}
          </div>

          {/* Nama */}
          <div className="space-y-2">
            <Label htmlFor="title">Nama (mis. nama vaksin)</Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="cth: Tricat Trio, Drontal"
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          {/* Tanggal */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recordDate">
                Tanggal Catatan <span className="text-primary">*</span>
              </Label>
              <Input
                id="recordDate"
                name="recordDate"
                type="date"
                defaultValue={todayStr()}
                max={todayStr()}
                className="h-12 rounded-2xl border-sand-border"
              />
              {errors.recordDate && (
                <p className="text-sm text-error">{errors.recordDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextDueDate">
                Jatuh Tempo Berikutnya (opsional)
              </Label>
              <Input
                id="nextDueDate"
                name="nextDueDate"
                type="date"
                className="h-12 rounded-2xl border-sand-border"
              />
              {errors.nextDueDate && (
                <p className="text-sm text-error">{errors.nextDueDate}</p>
              )}
            </div>
          </div>

          {/* Dokter & Biaya */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vetName">Dokter / Klinik</Label>
              <Input
                id="vetName"
                name="vetName"
                type="text"
                placeholder="cth: Klinik VetCare Puri"
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Biaya (Rp, opsional)</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                placeholder="cth: 180000"
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>
          </div>

          {/* Catatan */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Dosis, reaksi, hal penting lainnya..."
              className="rounded-2xl border-sand-border"
            />
          </div>

          {/* Foto */}
          <div className="space-y-2">
            <Label>Bukti Foto (opsional)</Label>
            <div className="flex h-20 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sand-border bg-surface-container-low text-sm text-text-muted">
              <span className="material-symbols-outlined text-xl">add_a_photo</span>
              Ambil dari kamera / galeri (maks. 5 MB)
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="h-14 w-full rounded-full text-base font-semibold"
            >
              {isSaving ? "Menyimpan..." : `Simpan untuk ${catName}`}
            </Button>
            <Link href={`/kucing/${catId}/kesehatan`} className="w-full">
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-full"
              >
                Batal
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
