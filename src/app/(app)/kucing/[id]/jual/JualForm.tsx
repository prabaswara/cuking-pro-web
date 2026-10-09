"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatRupiah } from "@/lib/mock";

interface JualFormProps {
  cat: { id: string; name: string; breed?: string | null; color?: string | null; birthDate?: string | null };
}

export function JualForm({ cat }: JualFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"listed" | "reserved" | "sold" | "cancelled">("listed");
  const [askingPrice, setAskingPrice] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPaid, setDepositPaid] = useState(false);
  const [saleDate, setSaleDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  function todayStr() {
    const t = new Date();
    return t.toISOString().slice(0, 10);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if ((status === "reserved" || status === "sold") && !buyerName.trim()) nextErrors.buyerName = "Nama pembeli wajib diisi";
    if (status === "sold") {
      if (!finalPrice || parseInt(finalPrice) < 0) nextErrors.finalPrice = "Harga akhir wajib diisi (≥ 0)";
      if (!saleDate) nextErrors.saleDate = "Tanggal jual wajib diisi";
      if (saleDate > todayStr()) nextErrors.saleDate = "Tanggal tidak boleh di masa depan";
    }
    if (depositAmount && finalPrice && parseInt(depositAmount) > parseInt(finalPrice)) {
      nextErrors.depositAmount = "DP tidak boleh lebih dari harga akhir";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsLoading(true);
    // TODO: POST /api/sales (with catId prefilled)
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);
    router.push("/breeding");
  }

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardHeader>
        <CardTitle className="text-lg">Catat Penjualan</CardTitle>
        <CardDescription>
          {cat.name} • {cat.breed ?? "-"} • {cat.color ?? "-"} • Lahir {cat.birthDate ? new Date(cat.birthDate).toLocaleDateString("id-ID") : "-"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Status *</Label>
            <div className="flex gap-2">
              {(["listed", "reserved", "sold", "cancelled"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${status === s ? "border-primary bg-tangerine-subtle text-primary" : "border-sand-border bg-surface-card text-on-surface"}`}
                >
                  {s === "listed" ? "Dijual" : s === "reserved" ? "Dipesan" : s === "sold" ? "Terjual" : "Batal"}
                </button>
              ))}
            </div>
          </div>

          {(status === "listed" || status === "reserved") && (
            <div className="space-y-1">
              <Label htmlFor="askingPrice">Harga Tawar (Rp)</Label>
              <Input
                id="askingPrice"
                type="number"
                min={0}
                step={100000}
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                placeholder="cth: 5000000"
                className="h-12 rounded-2xl border-sand-border"
              />
            </div>
          )}

          {(status === "reserved" || status === "sold") && (
            <>
              <div className="space-y-1">
                <Label htmlFor="buyerName">Nama Pembeli *</Label>
                <Input
                  id="buyerName"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Nama pembeli"
                  className="h-12 rounded-2xl border-sand-border"
                />
                {errors.buyerName && <p className="text-sm text-error">{errors.buyerName}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="buyerWhatsapp">WhatsApp Pembeli</Label>
                <Input
                  id="buyerWhatsapp"
                  value={buyerWhatsapp}
                  onChange={(e) => setBuyerWhatsapp(e.target.value)}
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
                  step={100000}
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder="cth: 5500000"
                  className="h-12 rounded-2xl border-sand-border"
                />
                {errors.finalPrice && <p className="text-sm text-error">{errors.finalPrice}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="depositAmount">DP (Rp)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  min={0}
                  step={100000}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="cth: 1000000"
                  className="h-12 rounded-2xl border-sand-border"
                />
                {errors.depositAmount && <p className="text-sm text-error">{errors.depositAmount}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="depositPaid"
                  checked={depositPaid}
                  onChange={(e) => setDepositPaid(e.target.checked)}
                  className="h-4 w-4 rounded border-sand-border text-primary"
                />
                <Label htmlFor="depositPaid" className="cursor-pointer">DP sudah dibayar</Label>
              </div>
              <div className="space-y-1">
                <Label htmlFor="saleDate">Tanggal Jual *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  max={todayStr()}
                  className="h-12 rounded-2xl border-sand-border"
                />
                {errors.saleDate && <p className="text-sm text-error">{errors.saleDate}</p>}
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor="notes">Catatan</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan"
              className="h-12 rounded-2xl border-sand-border"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button type="submit" disabled={isLoading} className="h-14 w-full rounded-full text-base font-semibold">
              {isLoading ? "Menyimpan..." : `Simpan Penjualan ${cat.name}`}
            </Button>
            <Link href={`/kucing/${cat.id}`} className="w-full">
              <Button type="button" variant="outline" className="h-12 w-full rounded-full">Batal</Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}