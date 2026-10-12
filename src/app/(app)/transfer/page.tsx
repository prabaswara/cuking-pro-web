import { connection } from "next/server";
import { TransferList } from "@/components/transfer/transfer-list";

export default async function TransferPage() {
  await connection();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Transfer Kepemilikan</h1>
        <p className="mt-1 text-text-muted">Pindahkan kucing ke pengguna lain dengan riwayat tersimpan</p>
      </div>

      <TransferList />
    </div>
  );
}