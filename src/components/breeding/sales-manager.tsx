"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateID, formatRupiah, todayIso } from "@/lib/date";
import type { CatSaleStatus } from "@/lib/validation/sale";
import type { SaleWithCat, SalesSummary } from "@/lib/sales";

const STATUS_STYLE: Record<
  CatSaleStatus,
  { bg: string; text: string; label: string }
> = {
  listed: { bg: "bg-primary-container", text: "text-primary", label: "Dijual" },
  reserved: {
    bg: "bg-amber-subtle",
    text: "text-honey-amber",
    label: "Dipesan",
  },
  sold: { bg: "bg-mint-subtle", text: "text-secondary", label: "Terjual" },
  cancelled: {
    bg: "bg-surface-container",
    text: "text-on-surface-variant",
    label: "Batal",
  },
};

type Filter = "semua" | CatSaleStatus;

function readApiError(data: unknown): string {
  return (
    (data as { error?: { message?: string } })?.error?.message ??
    "Terjadi kesalahan. Silakan coba lagi."
  );
}

function sortSales(items: SaleWithCat[]): SaleWithCat[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function SalesManager({
  initial,
  summary,
  cats,
}: {
  initial: {
    items: SaleWithCat[];
    lockedCount: number;
    windowStart: string | null;
  };
  summary: SalesSummary;
  cats: { id: string; name: string; photoPath: string | null }[];
}) {
  const [sales, setSales] = useState<SaleWithCat[]>(() =>
    sortSales(initial.items),
  );
  const [filter, setFilter] = useState<Filter>("semua");
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<SaleWithCat | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const visible = useMemo(
    () =>
      sales.filter((sale) => filter === "semua" || sale.status === filter),
    [filter, sales],
  );

  async function cancelSale(sale: SaleWithCat) {
    setBusyId(sale.id);
    setError(null);

    try {
      const response = await fetch(`/api/cat-sales/${sale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(readApiError(data));
        return;
      }

      const updated = (data as { sale: SaleWithCat }).sale;
      setSales((prev) =>
        prev.map((item) =>
          item.id === sale.id
            ? { ...item, ...updated, catPhotoPath: item.catPhotoPath }
            : item,
        ),
      );
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/cat-sales/${deleting.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(readApiError(data));
        return;
      }

      setSales((prev) => prev.filter((sale) => sale.id !== deleting.id));
      setDeleting(null);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-on-surface">
            Penjualan Kucing
          </h3>
          <p className="text-sm text-text-muted">
            Kelola penjualan dan pantau pendapatan bulan ini
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          disabled={cats.length === 0}
          className="h-10 rounded-full px-4"
        >
          <span className="material-symbols-outlined mr-1 text-xl">add</span>
          Tambah Penjualan
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Terjual Bulan Ini
            </p>
            <p className="mt-1 text-2xl font-bold text-on-surface">
              {summary.soldCount}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Pendapatan
            </p>
            <p className="mt-1 text-xl font-bold text-secondary">
              {formatRupiah(summary.totalRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["semua", "Semua"],
            ["listed", "Dijual"],
            ["reserved", "Dipesan"],
            ["sold", "Terjual"],
            ["cancelled", "Batal"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
              filter === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface-card text-text-muted shadow-sm"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && !open && !deleting && (
        <p className="rounded-xl bg-error-container p-3 text-sm text-error">
          {error}
        </p>
      )}

      {initial.lockedCount > 0 && initial.windowStart && (
        <p className="rounded-2xl border border-amber-subtle bg-amber-subtle/40 p-3 text-sm text-honey-amber">
          {initial.lockedCount} penjualan lama terkunci di paket Free
          (sebelum {formatDateID(initial.windowStart)}).
        </p>
      )}

      {visible.length === 0 ? (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-3xl text-text-muted">
                sell
              </span>
            </div>
            <h4 className="font-bold text-on-surface">Belum Ada Penjualan</h4>
            <p className="mt-1 max-w-xs text-sm text-text-muted">
              {cats.length === 0
                ? "Tambahkan kucing aktif dan dilacak terlebih dahulu."
                : "Tambah penjualan untuk mulai mencatat calon pembeli."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((sale) => {
            const style = STATUS_STYLE[sale.status];
            const canCancel =
              sale.status === "listed" || sale.status === "reserved";

            return (
              <Card
                key={sale.id}
                className="rounded-3xl border-sand-border shadow-warm-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container">
                        {sale.catPhotoPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sale.catPhotoPath}
                            alt={sale.catName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-xl text-text-muted">
                            pets
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-on-surface">
                          {sale.catName}
                        </p>
                        <p className="text-sm text-on-surface-variant">
                          {sale.askingPrice != null
                            ? formatRupiah(sale.askingPrice)
                            : "Harga belum diisi"}
                        </p>
                        {sale.saleDate && (
                          <p className="text-xs text-text-muted">
                            Terjual: {formatDateID(sale.saleDate)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${style.bg} ${style.text} shrink-0`}
                    >
                      {style.label}
                    </Badge>
                  </div>

                  {sale.buyerName && (
                    <p className="mt-2 text-sm text-on-surface-variant">
                      Pembeli:{" "}
                      <span className="font-medium text-on-surface">
                        {sale.buyerName}
                      </span>
                      {sale.buyerWhatsapp ? ` • ${sale.buyerWhatsapp}` : ""}
                    </p>
                  )}

                  {sale.status === "sold" && (
                    <div className="mt-2 rounded-2xl bg-mint-subtle px-3 py-2 text-sm text-secondary">
                      Harga akhir:{" "}
                      <span className="font-bold">
                        {formatRupiah(sale.finalPrice)}
                      </span>
                      {sale.depositAmount != null && sale.depositAmount > 0
                        ? ` • DP ${formatRupiah(sale.depositAmount)}${
                            sale.depositPaid ? " (lunas)" : " (belum lunas)"
                          }`
                        : ""}
                    </div>
                  )}

                  {sale.notes && (
                    <p className="mt-2 rounded-2xl bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
                      {sale.notes}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                    {sale.status !== "sold" && (
                      <Link href={`/penjualan/${sale.id}/edit`}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-full px-3"
                        >
                          Edit
                        </Button>
                      </Link>
                    )}
                    {canCancel && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => cancelSale(sale)}
                        disabled={busyId === sale.id}
                        className="h-9 rounded-full px-3"
                      >
                        {busyId === sale.id ? "Membatalkan..." : "Batalkan"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleting(sale);
                        setError(null);
                      }}
                      className="h-9 rounded-full px-3 text-error"
                    >
                      Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {open && (
        <SaleForm
          cats={cats}
          saving={saving}
          error={error}
          onClose={() => {
            setOpen(false);
            setError(null);
          }}
          onSubmit={async (payload) => {
            setSaving(true);
            setError(null);

            try {
              const response = await fetch("/api/cat-sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const data = await response.json().catch(() => null);

              if (!response.ok) {
                setError(readApiError(data));
                return;
              }

              const saved = (data as { sale: SaleWithCat }).sale;
              const cat = cats.find((item) => item.id === payload.catId);

              setSales((prev) =>
                sortSales([
                  ...prev,
                  {
                    ...saved,
                    catPhotoPath: cat?.photoPath ?? null,
                    catStatus: "active",
                  },
                ]),
              );
              setOpen(false);
            } catch {
              setError("Terjadi kesalahan. Silakan coba lagi.");
            } finally {
              setSaving(false);
            }
          }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
            <h3 className="font-bold text-on-surface">
              {deleting.status === "sold"
                ? "Hapus Penjualan Terjual?"
                : "Hapus Penjualan?"}
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Penjualan {deleting.catName} akan dihapus permanen.
              {deleting.status === "sold"
                ? " Kucing akan kembali berstatus aktif agar bisa dikoreksi."
                : ""}
            </p>
            {error && (
              <p className="mt-3 rounded-xl bg-error-container p-3 text-sm text-error">
                {error}
              </p>
            )}
            <div className="mt-6 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleting(null);
                  setError(null);
                }}
                disabled={saving}
                className="h-12 flex-1 rounded-full"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="h-12 flex-1 rounded-full bg-error text-white hover:bg-error/90"
              >
                {saving ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SaleForm({
  cats,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  cats: { id: string; name: string }[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const [catId, setCatId] = useState(cats[0]?.id ?? "");
  const [status, setStatus] = useState<CatSaleStatus>("listed");
  const [askingPrice, setAskingPrice] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPaid, setDepositPaid] = useState(false);
  const [saleDate, setSaleDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function numberOrNull(value: string): number | null {
    if (value.trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!catId) nextErrors.catId = "Pilih kucing";
    if (
      (status === "reserved" || status === "sold") &&
      !buyerName.trim()
    ) {
      nextErrors.buyerName = "Nama pembeli wajib diisi untuk status ini";
    }

    const finalValue = numberOrNull(finalPrice);
    const depositValue = numberOrNull(depositAmount);

    if (status === "sold" && finalValue == null) {
      nextErrors.finalPrice = "Harga akhir wajib diisi saat terjual";
    }
    if (status === "sold" && !saleDate) {
      nextErrors.saleDate = "Tanggal jual wajib diisi saat terjual";
    }
    if (saleDate && saleDate > todayIso()) {
      nextErrors.saleDate = "Tanggal jual tidak boleh di masa depan";
    }
    if (
      finalValue != null &&
      depositValue != null &&
      depositValue > finalValue
    ) {
      nextErrors.depositAmount = "DP tidak boleh lebih besar dari harga akhir";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      catId,
      status,
      askingPrice: numberOrNull(askingPrice),
      buyerName: buyerName.trim() || null,
      buyerWhatsapp: buyerWhatsapp.trim() || null,
      finalPrice: finalValue,
      depositAmount: depositValue,
      depositPaid,
      saleDate: saleDate || null,
      notes: notes.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">Tambah Penjualan</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {error && (
          <p className="rounded-xl bg-error-container p-3 text-sm text-error">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <Label htmlFor="sale-cat">Kucing *</Label>
          <select
            id="sale-cat"
            value={catId}
            onChange={(event) => setCatId(event.target.value)}
            className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-on-surface"
          >
            <option value="">Pilih kucing</option>
            {cats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.catId && (
            <p className="text-sm text-error">{errors.catId}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="sale-status">Status</Label>
          <select
            id="sale-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as CatSaleStatus)
            }
            className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-on-surface"
          >
            <option value="listed">Dijual</option>
            <option value="reserved">Dipesan</option>
            <option value="sold">Terjual</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="sale-asking">Harga Penawaran</Label>
          <Input
            id="sale-asking"
            type="number"
            min={0}
            value={askingPrice}
            onChange={(event) => setAskingPrice(event.target.value)}
            placeholder="Opsional"
            className="h-12 rounded-2xl border-sand-border"
          />
        </div>

        {(status === "reserved" || status === "sold") && (
          <>
            <div className="space-y-1">
              <Label htmlFor="sale-buyer">Nama Pembeli *</Label>
              <Input
                id="sale-buyer"
                value={buyerName}
                onChange={(event) => setBuyerName(event.target.value)}
                className="h-12 rounded-2xl border-sand-border"
              />
              {errors.buyerName && (
                <p className="text-sm text-error">{errors.buyerName}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="sale-wa">WhatsApp Pembeli</Label>
              <Input
                id="sale-wa"
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
              <Label htmlFor="sale-final">Harga Akhir *</Label>
              <Input
                id="sale-final"
                type="number"
                min={0}
                value={finalPrice}
                onChange={(event) => setFinalPrice(event.target.value)}
                className="h-12 rounded-2xl border-sand-border"
              />
              {errors.finalPrice && (
                <p className="text-sm text-error">{errors.finalPrice}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="sale-deposit">DP</Label>
              <Input
                id="sale-deposit"
                type="number"
                min={0}
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
                className="h-12 rounded-2xl border-sand-border"
              />
              {errors.depositAmount && (
                <p className="text-sm text-error">{errors.depositAmount}</p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-on-surface">
              <input
                type="checkbox"
                checked={depositPaid}
                onChange={(event) => setDepositPaid(event.target.checked)}
                className="h-5 w-5 rounded border-sand-border"
              />
              DP sudah dibayar
            </label>

            <div className="space-y-1">
              <Label htmlFor="sale-date">Tanggal Jual *</Label>
              <Input
                id="sale-date"
                type="date"
                value={saleDate}
                max={todayIso()}
                onChange={(event) => setSaleDate(event.target.value)}
                className="h-12 rounded-2xl border-sand-border"
              />
              {errors.saleDate && (
                <p className="text-sm text-error">{errors.saleDate}</p>
              )}
            </div>
          </>
        )}

        <div className="space-y-1">
          <Label htmlFor="sale-notes">Catatan</Label>
          <Textarea
            id="sale-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="rounded-2xl border-sand-border"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
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
  );
}
