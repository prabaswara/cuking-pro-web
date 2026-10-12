"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateID, formatRupiah, getTransactionsForUser, mockCats } from "@/lib/mock";
import type { Transaction } from "@/types";

const CATEGORIES = [
  "penjualan kucing",
  "jasa pacak",
  "pakan",
  "dokter",
  "perlengkapan",
  "lainnya",
];

export function KeuanganContent() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<"semua" | "income" | "expense">("semua");
  const [transactions, setTransactions] = useState(() => getTransactionsForUser("user-1"));

  const visible = transactions
    .filter((t) => (filter === "semua" ? true : t.type === filter))
    .sort((a, b) => b.txnDate.localeCompare(a.txnDate));

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-sand-border bg-surface-card p-4 shadow-warm-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Pemasukan</p>
          <p className="mt-1 text-2xl font-extrabold text-secondary">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="rounded-3xl border border-sand-border bg-surface-card p-4 shadow-warm-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Pengeluaran</p>
          <p className="mt-1 text-2xl font-extrabold text-error">{formatRupiah(totalExpense)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["semua", "income", "expense"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                filter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-surface-card text-text-muted shadow-sm"
              }`}
            >
              {f === "semua" ? "Semua" : f === "income" ? "Pemasukan" : "Pengeluaran"}
            </button>
          ))}
        </div>
        <Button onClick={() => setOpen(true)} className="h-10 rounded-full px-4">
          <span className="material-symbols-outlined mr-1 text-xl">add</span>
          Catat Transaksi
        </Button>
      </div>

      {visible.length === 0 ? (
        <Card className="rounded-3xl border-sand-border shadow-warm-sm">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <span className="material-symbols-outlined text-3xl text-text-muted">account_balance_wallet</span>
            </div>
            <h4 className="font-bold text-on-surface">Belum Ada Transaksi</h4>
            <p className="mt-1 max-w-xs text-sm text-text-muted">
              Catat pemasukan atau pengeluaran pertamamu.
            </p>
            <Button onClick={() => { setEditing(null); setOpen(true); }} className="mt-4 h-10 rounded-full px-4">Catat Transaksi Pertama</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {visible.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-2xl border border-sand-border bg-surface-card p-3.5 shadow-warm-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.type === "income" ? "bg-mint-subtle text-secondary" : "bg-error-container text-error"}`}>
                  <span className="material-symbols-outlined text-xl">{t.type === "income" ? "south_west" : "north_east"}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface truncate">{t.category}</p>
                  <p className="text-sm text-text-muted">
                    {formatDateID(t.txnDate)}
                    {t.catName ? ` • ${t.catName}` : ""}
                  </p>
                  {t.notes && <p className="text-xs text-text-muted truncate">{t.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`font-bold ${t.type === "income" ? "text-secondary" : "text-error"}`}>
                  {t.type === "income" ? "+" : "-"}{formatRupiah(t.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(t)}
                  aria-label="Edit"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-container hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(t)}
                  aria-label="Hapus"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-error-container hover:text-error"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <TransactionForm
          initial={editing}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSave={(data) => {
            if (editing) {
              setTransactions((prev) => prev.map((t) => (t.id === editing.id ? { ...t, ...data } : t)));
            } else {
              setTransactions((prev) => [
                { id: `tx-${Date.now()}`, userId: "user-1", catName: data.catId ? mockCats.find((c) => c.id === data.catId)?.name ?? null : null, ...data },
                ...prev,
              ]);
            }
          }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl">
            <h3 className="font-bold text-on-surface">Hapus Transaksi?</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Transaksi {deleting.category} {formatRupiah(deleting.amount)} akan dihapus permanen.
            </p>
            <div className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleting(null)} className="h-12 flex-1 rounded-full">Batal</Button>
              <Button
                type="button"
                onClick={() => {
                  setTransactions((prev) => prev.filter((t) => t.id !== deleting.id));
                  setDeleting(null);
                }}
                className="h-12 flex-1 rounded-full bg-error text-white hover:bg-error/90"
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TransactionFormProps {
  initial: Transaction | null;
  onClose: () => void;
  onSave: (data: { type: "income" | "expense"; category: string; amount: number; txnDate: string; catId: string; notes: string }) => void;
}

function TransactionForm({ initial, onClose, onSave }: TransactionFormProps) {
  const [type, setType] = useState<"income" | "expense">(initial?.type ?? "expense");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [txnDate, setTxnDate] = useState(initial?.txnDate ?? "");
  const [catId, setCatId] = useState(initial?.catId ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!category) nextErrors.category = "Pilih kategori";
    if (!amount || parseInt(amount) <= 0) nextErrors.amount = "Nominal harus lebih dari 0";
    if (!txnDate) nextErrors.txnDate = "Tanggal wajib diisi";
    if (txnDate > todayStr()) nextErrors.txnDate = "Tanggal tidak boleh di masa depan";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    // TODO: POST /api/transactions atau PATCH /api/transactions/:id
    onSave({ type, category, amount: parseInt(amount), txnDate, catId, notes });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-on-surface">{initial ? "Edit Transaksi" : "Catat Transaksi"}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-text-muted">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label>Jenis *</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setType("income")} className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${type === "income" ? "border-secondary bg-mint-subtle text-secondary" : "border-sand-border bg-surface-card text-on-surface"}`}>
                Pemasukan
              </button>
              <button type="button" onClick={() => setType("expense")} className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${type === "expense" ? "border-error bg-error-container text-error" : "border-sand-border bg-surface-card text-on-surface"}`}>
                Pengeluaran
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="category">Kategori *</Label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-sm">
              <option value="">Pilih kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className="text-sm text-error">{errors.category}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="amount">Nominal (Rp) *</Label>
            <Input id="amount" type="number" min={1} step={1000} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="cth: 850000" className="h-12 rounded-2xl border-sand-border" />
            {errors.amount && <p className="text-sm text-error">{errors.amount}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="txnDate">Tanggal *</Label>
            <Input id="txnDate" type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} max={todayStr()} className="h-12 rounded-2xl border-sand-border" />
            {errors.txnDate && <p className="text-sm text-error">{errors.txnDate}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="catId">Kucing Terkait (opsional)</Label>
            <select id="catId" value={catId} onChange={(e) => setCatId(e.target.value)} className="h-12 w-full rounded-2xl border-sand-border bg-surface-card px-4 text-sm">
              <option value="">Tidak ada</option>
              {mockCats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Catatan</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="cth: Royal Canin Kitten 15kg" className="h-12 rounded-2xl border-sand-border" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-12 flex-1 rounded-full">Batal</Button>
            <Button type="submit" className="h-12 flex-1 rounded-full">Simpan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}