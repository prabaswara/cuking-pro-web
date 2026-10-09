"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateID, formatRupiah, getCatSalesForUser } from "@/lib/mock";
import type { CatSale } from "@/types";

const STATUS_STYLE: Record<CatSale["status"], { bg: string; text: string; label: string }> = {
  listed: { bg: "bg-primary-container", text: "text-primary", label: "Dijual" },
  reserved: { bg: "bg-amber-subtle", text: "text-honey-amber", label: "Dipesan" },
  sold: { bg: "bg-mint-subtle", text: "text-secondary", label: "Terjual" },
  cancelled: { bg: "bg-surface-container", text: "text-on-surface-variant", label: "Batal" },
};

interface SalesListProps {
  userId: string;
}

export function SalesList({ userId }: SalesListProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"semua" | "listed" | "reserved" | "sold" | "cancelled">("semua");
  const sales = getCatSalesForUser(userId);

  const visible = sales.filter((s) => (filter === "semua" ? true : s.status === filter));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-on-surface">Penjualan Kucing</h3>
          <p className="text-sm text-text-muted">Kelola daftar kucing dijual</p>
        </div>
        <Button onClick={() => setOpen(true)} className="h-10 rounded-full px-4">
          <span className="material-symbols-outlined mr-1 text-xl">add</span>
          Catat Penjualan
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["semua", "listed", "reserved", "sold", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface-card text-text-muted shadow-sm"
            }`}
          >
            {f === "semua" ? "Semua" : f === "listed" ? "Dijual" : f === "reserved" ? "Dipesan" : f === "sold" ? "Terjual" : "Batal"}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center rounded-3xl p-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-3xl text-text-muted">sell</span>
            </div>
            <h4 className="font-bold text-on-surface">Belum Ada Penjualan</h4>
            <p className="mt-1 max-w-xs text-sm text-text-muted">
              Catat penjualan pertama untuk memulai.
            </p>
            <Button onClick={() => setOpen(true)} className="mt-4 h-10 rounded-full px-4">
              Catat Penjualan Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((sale) => (
            <SaleCard key={sale.id} sale={sale} />
          ))}
        </div>
      )}

      {/* Modal catat penjualan */}
      {open && <SaleForm onClose={() => setOpen(false)} />}
    </div>
  );
}

function SaleCard({ sale }: { sale: CatSale }) {
  const style = STATUS_STYLE[sale.status];
  const isActive = sale.status === "listed" || sale.status === "reserved";

  return (
    <Card className="rounded-3xl border-sand-border shadow-warm-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-subtle text-honey-amber">
              <span className="material-symbols-outlined text-xl">sell</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-on-surface truncate">{sale.catName}</p>
              <p className="text-sm text-text-muted">Dibuat: {formatDateID(sale.createdAt.toISOString())}</p>
              {sale.buyerName && (
                <p className="text-sm text-text-muted">Pembeli: {sale.buyerName} {sale.buyerWhatsapp ? `(${sale.buyerWhatsapp})` : ""}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`${style.bg} ${style.text}`}>
              {style.label}
            </Badge>
            {sale.status === "reserved" && sale.depositAmount && (
              <span className="text-sm font-semibold text-on-surface">
                DP: {formatRupiah(sale.depositAmount)} {sale.depositPaid ? "(Lunas)" : "(Belum)"}
              </span>
            )}
            {sale.finalPrice && (
              <span className="text-sm font-bold text-secondary">
                {formatRupiah(sale.finalPrice)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {sale.status === "listed" && (
            <>
              <Link href={`/penjualan/${sale.id}/edit`}>
                <Button size="sm" variant="outline" className="h-8 rounded-full">Ubah ke Dipesan</Button>
              </Link>
              <Button size="sm" variant="outline" className="h-8 rounded-full">Batal</Button>
            </>
          )}
          {sale.status === "reserved" && (
            <>
              <Link href={`/penjualan/${sale.id}/edit`}>
                <Button size="sm" className="h-8 rounded-full">Tandai Terjual</Button>
              </Link>
              <Button size="sm" variant="outline" className="h-8 rounded-full">Batal Pesanan</Button>
            </>
          )}
          {sale.status === "cancelled" && (
            <Button size="sm" variant="outline" className="h-8 rounded-full">Aktifkan Kembali</Button>
          )}
          {sale.status === "sold" && (
            <Button size="sm" variant="outline" className="h-8 rounded-full">Transfer ke Pembeli</Button>
          )}
        </div>

        {sale.notes && (
          <p className="mt-2 rounded-2xl bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
            {sale.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface SaleFormProps {
  onClose: () => void;
}

function SaleForm({ onClose }: SaleFormProps) {
  const [catName, setCatName] = useState("");
  const [status, setStatus] = useState<CatSale["status"]>("listed");
  const [askingPrice, setAskingPrice] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPaid, setDepositPaid] = useState(false);
  const [saleDate, setSaleDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function todayStr() {
    const t = new Date();
    return t.toISOString().slice(0, 10);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!catName.trim()) nextErrors.catName = "Nama kucing wajib diisi";
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
    // TODO: POST /api/sales
    onClose();
  }

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">Catat Penjualan Baru</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="catName">Nama Kucing *</Label>
            <Input
              id="catName"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="cth: Anak Mochi #1 (Lilac)"
              className="h-12 rounded-2xl border-sand-border"
            />
            {errors.catName && <p className="text-sm text-error">{errors.catName}</p>}
          </div>

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

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 rounded-full">Batal</Button>
            <Button type="submit" className="flex-1 h-12 rounded-full">Simpan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}