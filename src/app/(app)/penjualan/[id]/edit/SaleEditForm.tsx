"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatDateID, todayIso } from "@/lib/date";
import type { CatSaleRow } from "@/lib/sales";
import type { CatSaleStatus } from "@/lib/validation/sale";

const STATUS_LABEL: Record<CatSaleStatus, string> = {
  listed: "Dijual",
  reserved: "Dipesan",
  sold: "Terjual",
  cancelled: "Batal",
};

const ALLOWED: Record<CatSaleStatus, CatSaleStatus[]> = {
  listed: ["listed", "reserved", "sold", "cancelled"],
  reserved: ["reserved", "sold", "cancelled"],
  sold: ["sold"],
  cancelled: ["cancelled", "listed"],
};

function readApiError(data: unknown): string {
  return (
    (data as { error?: { message?: string } })?.error?.message ??
    "Terjadi kesalahan. Silakan coba lagi."
  );
}

export function SaleEditForm({ sale }: { sale: CatSaleRow }) {
  const router = useRouter();
  const [status, setStatus] = useState<CatSaleStatus>(sale.status);
  const [askingPrice, setAskingPrice] = useState(
    sale.askingPrice?.toString() ?? "",
  );
  const [buyerName, setBuyerName] = useState(sale.buyerName ?? "");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState(
    sale.buyerWhatsapp ?? "",
  );
  const [finalPrice, setFinalPrice] = useState(
    sale.finalPrice?.toString() ?? "",
  );
  const [depositAmount, setDepositAmount] = useState(
    sale.depositAmount?.toString() ?? "",
  );
  const [depositPaid, setDepositPaid] = useState(sale.depositPaid);
  const [saleDate, setSaleDate] = useState(sale.saleDate ?? "");
  const [notes, setNotes] = useState(sale.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function numberOrNull(value: string): number | null {
    if (value.trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const finalValue = numberOrNull(finalPrice);
    const depositValue = numberOrNull(depositAmount);

    if (
      (status === "reserved" || status === "sold") &&
      !buyerName.trim()
    ) {
      nextErrors.buyerName = "Nama pembeli wajib diisi";
    }
    if (status === "sold") {
      if (finalValue == null) {
        nextErrors.finalPrice = "Harga akhir wajib diisi";
      }
      if (!saleDate) {
        nextErrors.saleDate = "Tanggal jual wajib diisi";
      } else if (saleDate > todayIso()) {
        nextErrors.saleDate = "Tanggal tidak boleh di masa depan";
      }
    }
    if (
      finalValue != null &&
      depositValue != null &&
      depositValue > finalValue
    ) {
      nextErrors.depositAmount = "DP tidak boleh lebih dari harga akhir";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cat-sales/${sale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          askingPrice: numberOrNull(askingPrice),
          buyerName: buyerName.trim() || null,
          buyerWhatsapp: buyerWhatsapp.trim() || null,
          finalPrice: finalValue,
          depositAmount: depositValue,
          depositPaid,
          saleDate: saleDate || null,
          notes: notes.trim() || null,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return;
      }

      router.push("/breeding");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardHeader>
        <CardTitle className="text-lg">Ubah Penjualan</CardTitle>
        <CardDescription>
          {sale.catName} • Dibuat {formatDateID(sale.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-xl bg-error-container p-3 text-sm text-error">
              {error}
            </p>
          )}

          <div className="space-y-1">
            <Label>Status *</Label>
            <div className="flex flex-wrap gap-2">
              {ALLOWED[sale.status].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatus(option)}
                  className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold ${
                    status === option
                      ? "border-primary bg-tangerine-subtle text-primary"
                      : "border-sand-border bg-surface-card text-on-surface"
                  }`}
                >
                  {STATUS_LABEL[option]}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted">
              Alur: Dijual → Dipesan → Terjual. Terjual bersifat final; koreksi
              dengan menghapus penjualan.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="askingPrice">Harga Penawaran (Rp)</Label>
            <Input
              id="askingPrice"
              type="number"
              min={0}
              value={askingPrice}
              onChange={(event) => setAskingPrice(event.target.value)}
              placeholder="cth: 5000000"
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          {(status === "reserved" || status === "sold") && (
            <>
              <div className="space-y-1">
                <Label htmlFor="buyerName">Nama Pembeli *</Label>
                <Input
                  id="buyerName"
                  value={buyerName}
                  onChange={(event) => setBuyerName(event.target.value)}
                  placeholder="Nama pembeli"
                  className="h-12 rounded-2xl border-sand-border"
                />
                {errors.buyerName && (
                  <p className="text-sm text-error">{errors.buyerName}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="buyerWhatsapp">WhatsApp Pembeli</Label>
                <Input
                  id="buyerWhatsapp"
                  value={buyerWhatsapp}
                  onChange={(event) => setBuyerWhatsapp(event.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="h-12 rounded-2xl border-sand-border"
                />
              </div>
            </>
          )}

          {status === "sold" && (
            <>
              <div className="space-y-1">
                <Label htmlFor="finalPrice">Harga Akhir (Rp) *</Label>
                <Input
                  id="finalPrice"
                  type="number"
                  min={0}
                  value={finalPrice}
                  onChange={(event) => setFinalPrice(event.target.value)}
                  placeholder="cth: 5500000"
                  className="h-12 rounded-2xl border-sand-border"
                />
                {errors.finalPrice && (
                  <p className="text-sm text-error">{errors.finalPrice}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="depositAmount">DP (Rp)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  min={0}
                  value={depositAmount}
                  onChange={(event) => setDepositAmount(event.target.value)}
                  placeholder="cth: 1000000"
                  className="h-12 rounded-2xl border-sand-border"
                />
                {errors.depositAmount && (
                  <p className="text-sm text-error">{errors.depositAmount}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="depositPaid"
                  checked={depositPaid}
                  onChange={(event) => setDepositPaid(event.target.checked)}
                  className="h-4 w-4 rounded border-sand-border text-primary"
                />
                <Label htmlFor="depositPaid" className="cursor-pointer">
                  DP sudah dibayar
                </Label>
              </div>

              <div className="space-y-1">
                <Label htmlFor="saleDate">Tanggal Jual *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={saleDate}
                  onChange={(event) => setSaleDate(event.target.value)}
                  max={todayIso()}
                  className="h-12 rounded-2xl border-sand-border"
                />
                {errors.saleDate && (
                  <p className="text-sm text-error">{errors.saleDate}</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor="notes">Catatan</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Catatan tambahan"
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-14 w-full rounded-full text-base font-semibold"
            >
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
            <Link href="/breeding" className="w-full">
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
