"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateID, todayIso } from "@/lib/date";

function readApiError(data: unknown): string {
  return (
    (data as { error?: { message?: string } })?.error?.message ??
    "Terjadi kesalahan. Silakan coba lagi."
  );
}

export function BirthForm({
  matingId,
  matingDate,
  expectedDueDate,
  queenName,
}: {
  matingId: string;
  matingDate: string;
  expectedDueDate: string | null;
  queenName: string;
}) {
  const router = useRouter();
  const [birthDate, setBirthDate] = useState(
    expectedDueDate && expectedDueDate <= todayIso()
      ? expectedDueDate
      : todayIso(),
  );
  const [totalBorn, setTotalBorn] = useState("");
  const [totalAlive, setTotalAlive] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const born = Number(totalBorn);
    const alive = Number(totalAlive);

    if (!birthDate) nextErrors.birthDate = "Tanggal lahir wajib diisi";
    if (birthDate > todayIso()) {
      nextErrors.birthDate = "Tanggal tidak boleh di masa depan";
    }
    if (birthDate && birthDate < matingDate) {
      nextErrors.birthDate = "Tanggal lahir tidak boleh sebelum tanggal kawin";
    }
    if (!totalBorn || !Number.isInteger(born) || born < 1) {
      nextErrors.totalBorn = "Jumlah lahir minimal 1";
    }
    if (totalAlive === "" || !Number.isInteger(alive) || alive < 0) {
      nextErrors.totalAlive = "Jumlah hidup tidak boleh negatif";
    } else if (born > 0 && alive > born) {
      nextErrors.totalAlive =
        "Jumlah hidup tidak boleh lebih dari jumlah lahir";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/matings/${matingId}/litter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate,
          totalBorn: born,
          totalAlive: alive,
          notes: notes.trim() || null,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return;
      }

      const litter = (data as { litter: { id: string } }).litter;
      router.push(`/breeding/litter/${litter.id}/tambah-anak`);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-xl bg-error-container p-3 text-sm text-error">
              {error}
            </p>
          )}

          <div className="space-y-1">
            <Label htmlFor="birth-date">Tanggal Lahir *</Label>
            <Input
              id="birth-date"
              type="date"
              value={birthDate}
              min={matingDate}
              max={todayIso()}
              onChange={(event) => setBirthDate(event.target.value)}
              className="h-12 rounded-2xl border-sand-border"
            />
            {errors.birthDate && (
              <p className="text-sm text-error">{errors.birthDate}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="total-born">Jumlah Lahir *</Label>
              <Input
                id="total-born"
                type="number"
                min={1}
                max={20}
                value={totalBorn}
                onChange={(event) => setTotalBorn(event.target.value)}
                placeholder="0"
                className="h-12 rounded-2xl border-sand-border"
              />
              {errors.totalBorn && (
                <p className="text-sm text-error">{errors.totalBorn}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="total-alive">Jumlah Hidup *</Label>
              <Input
                id="total-alive"
                type="number"
                min={0}
                max={20}
                value={totalAlive}
                onChange={(event) => setTotalAlive(event.target.value)}
                placeholder="0"
                className="h-12 rounded-2xl border-sand-border"
              />
              {errors.totalAlive && (
                <p className="text-sm text-error">{errors.totalAlive}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="birth-notes">Catatan</Label>
            <Textarea
              id="birth-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Kondisi kelahiran, dll."
              className="rounded-2xl border-sand-border"
            />
          </div>

          <div className="rounded-2xl bg-surface-container-low p-3 text-sm text-text-muted">
            Estimasi lahir sebelumnya:{" "}
            {expectedDueDate ? formatDateID(expectedDueDate) : "-"}. Setelah
            disimpan, status kehamilan {queenName} menjadi Sudah Melahirkan dan
            pengingat estimasi lahir ditutup.
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="h-12 w-full rounded-full"
          >
            {saving ? "Menyimpan..." : "Simpan Kelahiran"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
