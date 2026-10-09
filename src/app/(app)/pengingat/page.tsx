import { connection } from "next/server";
import { PengingatList } from "@/components/pengingat/pengingat-list";

export default async function PengingatPage() {
  await connection();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">
          Mendatang & Pengingat
        </h1>
        <p className="mt-1 text-text-muted">
          Jadwal penting 7 hari ke depan (dikirim H-3 & hari-H via email +
          notifikasi web)
        </p>
      </div>

      <PengingatList />
    </div>
  );
}
