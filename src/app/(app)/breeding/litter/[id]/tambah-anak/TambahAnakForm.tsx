"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GenderSelect } from "@/components/kucing/gender-select";

interface TambahAnakFormProps {
  litterId: string;
  totalAlive: number;
  queenName: string;
  sireName: string;
}

export function TambahAnakForm({ litterId, totalAlive, queenName, sireName }: TambahAnakFormProps) {
  const router = useRouter();
  const [submittedCount, setSubmittedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Default values for each kitten
  const [kitten, setKitten] = useState({
    name: "",
    sex: "",
    color: "",
    breed: "",
    birthDate: "",
    photoPath: null as string | null,
  });

  function todayStr() {
    const t = new Date();
    return t.toISOString().slice(0, 10);
  }

  function handleChange(field: string, value: string) {
    setKitten(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const sex = formData.get("sex") as string;
    const name = formData.get("name") as string;
    const breed = formData.get("breed") as string;
    const color = formData.get("color") as string;
    const birthDate = formData.get("birthDate") as string;

    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Nama wajib diisi";
    if (!sex) nextErrors.sex = "Pilih jenis kelamin";
    if (!color.trim()) nextErrors.color = "Warna wajib diisi";
    if (!birthDate) nextErrors.birthDate = "Tanggal lahir wajib diisi";
    if (birthDate > todayStr()) nextErrors.birthDate = "Tanggal tidak boleh di masa depan";
    if (!breed.trim()) nextErrors.breed = "Ras wajib diisi";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsLoading(true);
    // TODO: POST /api/litters/:id/kittens
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);

    const nextCount = submittedCount + 1;
    setSubmittedCount(nextCount);

    if (nextCount >= totalAlive) {
      router.push(`/breeding/litter/${litterId}`);
    }
  }

  const remaining = totalAlive - submittedCount;

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardHeader>
        <CardTitle className="text-lg">Data Anak Kucing</CardTitle>
        <CardDescription>
          Masukkan data anak ke-{submittedCount + 1} dari {totalAlive} hidup
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama *</Label>
            <Input
              id="name"
              value={kitten.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="cth: Mochi Jr."
              className="h-12 rounded-2xl border-sand-border"
            />
            {errors.name && <p className="text-sm text-error">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label>Jenis Kelamin *</Label>
            <GenderSelect name="sex" defaultValue={kitten.sex as "male" | "female" | ""} />
            {errors.sex && <p className="text-sm text-error">{errors.sex}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="breed">Ras *</Label>
            <Input
              id="breed"
              value={kitten.breed}
              onChange={(e) => handleChange("breed", e.target.value)}
              placeholder="cth: British Shorthair"
              className="h-12 rounded-2xl border-sand-border"
            />
            {errors.breed && <p className="text-sm text-error">{errors.breed}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Warna *</Label>
            <Input
              id="color"
              value={kitten.color}
              onChange={(e) => handleChange("color", e.target.value)}
              placeholder="cth: Lilac Solid"
              className="h-12 rounded-2xl border-sand-border"
            />
            {errors.color && <p className="text-sm text-error">{errors.color}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Tanggal Lahir *</Label>
            <Input
              id="birthDate"
              type="date"
              value={kitten.birthDate}
              onChange={(e) => handleChange("birthDate", e.target.value)}
              max={todayStr()}
              className="h-12 rounded-2xl border-sand-border"
            />
            {errors.birthDate && <p className="text-sm text-error">{errors.birthDate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Catatan khusus (mis. warna kaki, ciri khas, dll.)"
              className="rounded-2xl border-sand-border"
            />
          </div>

          <div className="space-y-2">
            <Label>Foto (opsional)</Label>
            <div className="flex h-24 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sand-border bg-surface-container-low text-sm text-text-muted">
              <span className="material-symbols-outlined text-xl">add_a_photo</span>
              Ambil dari kamera / galeri (maks. 5 MB)
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="h-14 w-full rounded-full text-base font-semibold">
              {isLoading ? "Menyimpan..." : `Simpan Anak Kucing (${remaining} tersisa)`}
            </Button>
            <Link href={`/breeding/litter/${litterId}`} className="w-full">
              <Button type="button" variant="outline" className="h-12 w-full rounded-full" disabled={submittedCount === 0}>
                Selesai & Kembali
              </Button>
            </Link>
          </div>

          <p className="text-center text-xs text-text-muted">
            {remaining} dari {totalAlive} anak kucing yang perlu didaftarkan
          </p>
        </form>
      </CardContent>
    </Card>
  );
}