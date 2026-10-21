"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GenderSelect } from "@/components/kucing/gender-select";
import Link from "next/link";

export default function TambahKucingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const sex = String(formData.get("sex") ?? "");

    if (!sex) {
      setError("Pilih jenis kelamin kucing.");
      return;
    }

    const text = (key: string) => {
      const value = String(formData.get(key) ?? "").trim();
      return value || null;
    };

    setIsLoading(true);

    try {
      const response = await fetch("/api/cats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? "").trim(),
          sex,
          breed: text("breed"),
          color: text("color"),
          birthDate: text("birthDate"),
          notes: text("notes"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message ?? "Gagal menyimpan kucing.");
        return;
      }

      router.push("/kucing");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-on-surface">
          Tambah Kucing Baru 🐱
        </h1>
        <p className="mt-2 text-text-muted">
          Isi detail dasar anabul kesayanganmu
        </p>
      </div>

      {/* Form */}
      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Data Kucing</CardTitle>
          <CardDescription>
            Field dengan tanda * wajib diisi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="rounded-2xl bg-error-container p-4 text-sm text-error">
                {error}
              </div>
            )}

            {/* Photo Upload */}
            <div className="flex flex-col items-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-warm-cream">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-subtle">
                    <span className="material-symbols-outlined text-2xl text-honey-amber">
                      add_a_photo
                    </span>
                  </div>
                  <span className="mt-1 text-xs font-medium text-on-surface">
                    Unggah Foto
                  </span>
                  <span className="text-[10px] text-text-muted">Maks. 5MB</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-text-muted">
                Format JPG atau PNG
              </p>
            </div>

            {/* Nama */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Kucing <span className="text-primary">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="cth: Mochi, Luna, Oyen"
                required
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>

            {/* Jenis Kelamin */}
            <div className="space-y-2">
              <Label>
                Jenis Kelamin <span className="text-primary">*</span>
              </Label>
              <GenderSelect />
            </div>

            {/* Tanggal Lahir */}
            <div className="space-y-2">
              <Label htmlFor="birthDate">Tanggal Lahir / Adopsi</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>

            {/* Ras */}
            <div className="space-y-2">
              <Label htmlFor="breed">Ras Kucing</Label>
              <select
                id="breed"
                name="breed"
                className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-on-surface"
              >
                <option value="">Pilih ras anabul...</option>
                <option value="Domestik / Kucing Kampung">Domestik / Kucing Kampung</option>
                <option value="British Shorthair">British Shorthair</option>
                <option value="Persia">Persia</option>
                <option value="Maine Coon">Maine Coon</option>
                <option value="Ragdoll">Ragdoll</option>
                <option value="Scottish Fold">Scottish Fold</option>
                <option value="Bengal">Bengal</option>
                <option value="Siamese">Siamese</option>
                <option value="Sphynx">Sphynx</option>
                <option value="Campuran / Mix Breed">Campuran / Mix Breed</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Warna */}
            <div className="space-y-2">
              <Label htmlFor="color">Warna & Corak Bulu</Label>
              <Input
                id="color"
                name="color"
                type="text"
                placeholder="cth: Orange Tabby, Calico Tiga Warna"
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>

            {/* Catatan */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Khusus (Opsional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Alergi makanan, kebiasaan, dll..."
                rows={3}
                className="rounded-2xl border-sand-border"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-14 w-full rounded-full text-base font-semibold"
              >
                {isLoading ? "Menyimpan..." : "Simpan & Lanjut ke Daftar Kucing"}
              </Button>
              <Link href="/kucing" className="w-full">
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
    </div>
  );
}
