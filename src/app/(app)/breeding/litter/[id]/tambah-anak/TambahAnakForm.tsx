"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { GenderSelect } from "@/components/kucing/gender-select";
import { formatDateID, todayIso } from "@/lib/date";

function readApiError(data: unknown): string {
  return (
    (data as { error?: { message?: string } })?.error?.message ??
    "Terjadi kesalahan. Silakan coba lagi."
  );
}

export function TambahAnakForm({
  litterId,
  litterBirthDate,
  totalAlive,
  registeredCount,
  queenName,
  sireName,
}: {
  litterId: string;
  litterBirthDate: string;
  totalAlive: number;
  registeredCount: number;
  queenName: string;
  sireName: string;
}) {
  const router = useRouter();
  const [registered, setRegistered] = useState(registeredCount);
  const [kitten, setKitten] = useState({
    name: "",
    sex: "" as "" | "male" | "female",
    color: "",
    breed: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const remaining = Math.max(totalAlive - registered, 0);

  function handleChange(field: keyof typeof kitten, value: string) {
    setKitten((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!kitten.name.trim()) nextErrors.name = "Nama wajib diisi";
    if (!kitten.sex) nextErrors.sex = "Pilih jenis kelamin";
    if (!kitten.color.trim()) nextErrors.color = "Warna wajib diisi";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/litters/${litterId}/kittens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: kitten.name.trim(),
          sex: kitten.sex,
          breed: kitten.breed.trim() || null,
          color: kitten.color.trim(),
          birthDate: litterBirthDate,
          notes: kitten.notes.trim() || null,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return;
      }

      const nextRegistered = registered + 1;
      setRegistered(nextRegistered);
      setKitten({ name: "", sex: "", color: "", breed: "", notes: "" });

      if (nextRegistered >= totalAlive) {
        router.push(`/breeding/litter/${litterId}`);
        return;
      }

      setSuccess(
        `Anak kucing berhasil didaftarkan. ${Math.max(
          totalAlive - nextRegistered,
          0,
        )} anak hidup lagi yang belum didaftarkan.`,
      );
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardHeader>
        <CardTitle className="text-lg">Data Anak Kucing</CardTitle>
        <CardDescription>
          {queenName} × {sireName} • Lahir {formatDateID(litterBirthDate)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-xl bg-error-container p-3 text-sm text-error">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-xl bg-mint-subtle p-3 text-sm text-secondary">
              {success}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nama *</Label>
            <Input
              id="name"
              value={kitten.name}
              onChange={(event) => handleChange("name", event.target.value)}
              placeholder="cth: Mochi Jr."
              className="h-12 rounded-2xl border-sand-border"
            />
            {errors.name && (
              <p className="text-sm text-error">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Jenis Kelamin *</Label>
            <GenderSelect
              name="sex"
              defaultValue={kitten.sex}
              onChange={(value) => handleChange("sex", value)}
            />
            {errors.sex && <p className="text-sm text-error">{errors.sex}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Warna *</Label>
            <Input
              id="color"
              value={kitten.color}
              onChange={(event) => handleChange("color", event.target.value)}
              placeholder="cth: Lilac Solid"
              className="h-12 rounded-2xl border-sand-border"
            />
            {errors.color && (
              <p className="text-sm text-error">{errors.color}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="breed">Ras (opsional)</Label>
            <Input
              id="breed"
              value={kitten.breed}
              onChange={(event) => handleChange("breed", event.target.value)}
              placeholder="cth: British Shorthair"
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Tanggal Lahir</Label>
            <Input
              id="birthDate"
              type="date"
              value={litterBirthDate}
              disabled
              max={todayIso()}
              className="h-12 rounded-2xl border-sand-border"
            />
            <p className="text-xs text-text-muted">
              Mengikuti tanggal lahir litter. Bisa diubah dari halaman detail
              kucing setelah terdaftar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={kitten.notes}
              onChange={(event) => handleChange("notes", event.target.value)}
              rows={3}
              placeholder="Catatan khusus (mis. warna kaki, ciri khas, dll.)"
              className="rounded-2xl border-sand-border"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-14 w-full rounded-full text-base font-semibold"
            >
              {isLoading
                ? "Menyimpan..."
                : `Simpan Anak Kucing (${remaining} tersisa)`}
            </Button>
            <Link href={`/breeding/litter/${litterId}`} className="w-full">
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-full"
                disabled={isLoading}
              >
                Selesai & Kembali
              </Button>
            </Link>
          </div>

          <p className="text-center text-xs text-text-muted">
            {registered} dari {totalAlive} anak hidup sudah didaftarkan
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
