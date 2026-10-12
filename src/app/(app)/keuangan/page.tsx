import { connection } from "next/server";
import { KeuanganContent } from "@/components/keuangan/keuangan-content";

export default async function KeuanganPage() {
  await connection();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Keuangan</h1>
        <p className="mt-1 text-text-muted">Catat pemasukan & pengeluaran</p>
      </div>

      <KeuanganContent />
    </div>
  );
}