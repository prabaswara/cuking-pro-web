"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getMating, getQueenDisplayName } from "@/lib/mock";
import { formatDateID } from "@/lib/mock";

interface LahirPageProps {
  params: Promise<{ id: string }>;
}

export default function LahirPage({ params }: LahirPageProps) {
  const router = useRouter();
  const [matingData, setMatingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [birthDate, setBirthDate] = useState("");
  const [totalBorn, setTotalBorn] = useState("");
  const [totalAlive, setTotalAlive] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Client-side mock fetch
    const { getMating: getMatingMock } = require("@/lib/mock");
    params.then(({ id }) => {
      const data = getMatingMock(id);
      setMatingData(data);
      setLoading(false);
    });
  }, [params]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <div className="animate-pulse">
            <span className="material-symbols-outlined text-3xl text-primary">cradle</span>
          </div>
          <p className="text-sm font-medium text-text-muted">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!matingData) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border-sand-border bg-surface-card p-8 text-center shadow-warm-sm">
          <p className="font-bold text-on-surface">Kawin tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const queenName = getQueenDisplayName(matingData);

  function todayStr() {
    const t = new Date();
    return t.toISOString().slice(0, 10);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!birthDate) nextErrors.birthDate = "Tanggal lahir wajib diisi";
    if (birthDate > todayStr()) nextErrors.birthDate = "Tanggal tidak boleh di masa depan";
    if (!totalBorn || parseInt(totalBorn) <= 0) nextErrors.totalBorn = "Jumlah lahir minimal 1";
    if (!totalAlive || parseInt(totalAlive) < 0) nextErrors.totalAlive = "Jumlah hidup minimal 0";
    if (parseInt(totalAlive) > parseInt(totalBorn)) nextErrors.totalAlive = "Hidup tidak boleh lebih dari lahir";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    // TODO: POST /api/matings/:id/litter
    setTimeout(() => {
      setSaving(false);
      router.push(`/breeding/litter/new?matingId=${matingData.id}`);
    }, 800);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/breeding/kehamilan/${matingData.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Kehamilan
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">Catat Kelahiran</h1>
        <p className="mt-1 text-text-muted">{queenName} — Estimasi lahir: {matingData.expectedDueDate ? formatDateID(matingData.expectedDueDate) : "-"}</p>
      </div>

      <Card className="rounded-3xl border-sand-border shadow-warm-sm">
        <CardHeader>
          <CardTitle className="text-lg">Data Kelahiran</CardTitle>
          <CardDescription>Isi detail kelahiran litter</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="birthDate">Tanggal Lahir *</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={todayStr()}
                className="h-12 rounded-2xl border-sand-border"
              />
              {errors.birthDate && <p className="text-sm text-error">{errors.birthDate}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="totalBorn">Jumlah Lahir *</Label>
                <Input
                  id="totalBorn"
                  type="number"
                  min={1}
                  max={15}
                  value={totalBorn}
                  onChange={(e) => setTotalBorn(e.target.value)}
                  className="h-12 rounded-2xl border-sand-border"
                />
                {errors.totalBorn && <p className="text-sm text-error">{errors.totalBorn}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="totalAlive">Jumlah Hidup *</Label>
                <Input
                  id="totalAlive"
                  type="number"
                  min={0}
                  max={15}
                  value={totalAlive}
                  onChange={(e) => setTotalAlive(e.target.value)}
                  className="h-12 rounded-2xl border-sand-border"
                />
                {errors.totalAlive && <p className="text-sm text-error">{errors.totalAlive}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Catatan</Label>
              <Input
                id="notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Kondisi lahir, catatan khusus, dll."
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Link href={`/breeding/kehamilan/${matingData.id}`}>
                <Button type="button" variant="outline" className="h-12 flex-1 rounded-full">Batal</Button>
              </Link>
              <Button type="submit" disabled={saving} className="h-12 flex-1 rounded-full">
                {saving ? "Menyimpan..." : "Simpan & Lanjut Tambah Anak"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}