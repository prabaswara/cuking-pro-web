"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface PakanFormProps {
  catId: string;
  catName: string;
}

export function PakanForm({ catId, catName }: PakanFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [schedule, setSchedule] = useState("");
  const [portion, setPortion] = useState("");
  const [foodType, setFoodType] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!schedule) nextErrors.schedule = "Waktu makan wajib diisi";
    if (!portion || parseFloat(portion) <= 0) nextErrors.portion = "Porsi harus > 0";
    if (!foodType.trim()) nextErrors.foodType = "Jenis pakan wajib diisi";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsLoading(true);
    // TODO: POST /api/cats/:id/feeding-schedule
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);
    router.push(`/kucing/${catId}`);
  }

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardHeader>
        <CardTitle className="text-lg">Jadwal Makan Baru</CardTitle>
        <CardDescription>Atur waktu, porsi, dan jenis pakan untuk {catName}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="schedule">Waktu Makan *</Label>
              <Input
                id="schedule"
                type="time"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="h-12 rounded-2xl border-sand-border"
              />
              {errors.schedule && <p className="text-sm text-error">{errors.schedule}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="portion">Porsi (gram) *</Label>
              <Input
                id="portion"
                type="number"
                step="1"
                min="1"
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                placeholder="cth: 50"
                className="h-12 rounded-2xl border-sand-border"
              />
              {errors.portion && <p className="text-sm text-error">{errors.portion}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="foodType">Jenis Pakan *</Label>
            <Input
              id="foodType"
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              placeholder="cth: Royal Canin Kitten, Whiskas, Raw food"
              className="h-12 rounded-2xl border-sand-border"
            />
            {errors.foodType && <p className="text-sm text-error">{errors.foodType}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Catatan</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan khusus (mis. alergi, suplemen, dll.)"
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="h-14 w-full rounded-full text-base font-semibold">
              {isLoading ? "Menyimpan..." : `Simpan Jadwal untuk ${catName}`}
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