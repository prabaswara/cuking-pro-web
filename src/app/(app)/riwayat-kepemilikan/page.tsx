import { connection } from "next/server";
import { OwnershipHistoryList } from "@/components/transfer/ownership-history-list";

export default async function RiwayatKepemilikanPage() {
  await connection();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Riwayat Kepemilikan</h1>
        <p className="mt-1 text-text-muted">Arsip kucing yang pernah kamu miliki</p>
      </div>

      <OwnershipHistoryList />
    </div>
  );
}