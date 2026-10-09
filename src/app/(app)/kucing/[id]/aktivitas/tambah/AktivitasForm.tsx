"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ACTIVITY_TYPES = [
  { value: "main", label: "Main", icon: "sports_esports" },
  { value: "tidur", label: "Tidur", icon: "bedtime" },
  { value: "kembung", label: "Kembung/Busung", icon: "warning" },
  { value: "peliharaan", label: "Perawatan (Sisir, Mandi)", icon: "spa" },
  { value: "vet", label: "Kunjungan Vet", icon: "medical_services" },
  { value: "lainnya", label: "Lainnya", icon: "description" },
] as const;

interface AktivitasFormProps {
  catId: string;
  catName: string;
}

export function AktivitasForm({ catId, catName }: AktivitasFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!type) nextErrors.type = "Pilih jenis aktivitas";
    if (!duration || parseInt(duration) <= 0) nextErrors.duration = "Durasi harus > 0 menit";
    if (!notes.trim()) nextErrors.notes = "Catatan wajib diisi";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsLoading(true);
    // TODO: POST /api/cats/:id/activities
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);
    router.push(`/kucing/${catId}`);
  }

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardHeader>
        <CardTitle className="text-lg">Aktivitas Baru</CardTitle>
        <CardDescription>Catat aktivitas harian {catName}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Jenis Aktivitas *</Label>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_TYPES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.98] ${
                    type === opt.value
                      ? "border-primary bg-tangerine-subtle text-primary"
                      : "border-sand-border bg-surface-card text-on-surface hover:border-primary/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{opt.icon}</span>
                  <span className="text-sm font-semibold">{opt.label}</span>
                  {type === opt.value && <span className="material-symbols-outlined text-lg">check_circle</span>}
                </button>
              ))}
            </div>
            {errors.type && <p className="text-sm text-error">{errors.type}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="duration">Durasi (menit) *</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="1440"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="cth: 30"
              className="h-12 rounded-2xl border-sand-border"
            />
            {errors.duration && <p className="text-sm text-error">{errors.duration}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Catatan *</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail aktivitas, perilaku yang diamati, dll."
              className="h-12 rounded-2xl border-sand-border"
            />
            {errors.notes && <p className="text-sm text-error">{errors.notes}</p>}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="h-14 w-full rounded-full text-base font-semibold">
              {isLoading ? "Menyimpan..." : `Simpan Aktivitas ${catName}`}
            </Button>
            <Link href={`/kucing/${catId}`} className="w-full">
              <Button type="button" variant="outline" className="h-12 w-full rounded-full">Batal</Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}