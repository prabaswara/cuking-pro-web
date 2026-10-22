"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function readApiError(data: unknown): string {
  return (
    (data as { error?: { message?: string } })?.error?.message ??
    "Terjadi kesalahan. Silakan coba lagi."
  );
}

export function MatingActions({
  matingId,
  outcome,
  expectedDueDate,
  hasLitter,
}: {
  matingId: string;
  outcome: "pending" | "pregnant" | "not_pregnant" | "delivered";
  expectedDueDate: string | null;
  hasLitter: boolean;
}) {
  const router = useRouter();
  const [editingDate, setEditingDate] = useState(false);
  const [dueDate, setDueDate] = useState(expectedDueDate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(payload: Record<string, unknown>) {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/matings/${matingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return;
      }

      setEditingDate(false);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  if (hasLitter || outcome === "delivered") {
    return null;
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl bg-error-container p-3 text-sm text-error">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {outcome === "pregnant" ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDueDate(expectedDueDate ?? "");
                setEditingDate(true);
                setError(null);
              }}
              disabled={saving}
              className="h-12 flex-1 rounded-full"
            >
              Ubah Estimasi Lahir
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => patch({ outcome: "not_pregnant" })}
              disabled={saving}
              className="h-12 flex-1 rounded-full text-error"
            >
              Tandai Tidak Hamil
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              onClick={() => patch({ outcome: "pregnant" })}
              disabled={saving}
              className="h-12 flex-1 rounded-full"
            >
              Konfirmasi Hamil
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => patch({ outcome: "not_pregnant" })}
              disabled={saving}
              className="h-12 flex-1 rounded-full text-error"
            >
              Tandai Tidak Hamil
            </Button>
          </>
        )}
      </div>

      {editingDate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!dueDate) {
                setError("Estimasi lahir wajib diisi");
                return;
              }
              patch({ expectedDueDate: dueDate });
            }}
            className="w-full max-w-md space-y-4 rounded-3xl bg-surface-card p-6 shadow-2xl"
          >
            <h3 className="font-bold text-on-surface">Ubah Estimasi Lahir</h3>
            <div className="space-y-1">
              <Label htmlFor="due-date">Tanggal Estimasi Lahir</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingDate(false);
                  setError(null);
                }}
                disabled={saving}
                className="h-12 flex-1 rounded-full"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-12 flex-1 rounded-full"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
