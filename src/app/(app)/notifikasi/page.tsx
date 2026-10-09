import { connection } from "next/server";
import { NotifikasiContent } from "@/components/notifikasi/notifikasi-content";

export default async function NotifikasiPage() {
  await connection();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Notifikasi</h1>
        <p className="mt-1 text-text-muted">
          Atur pengingat via email dan notifikasi web
        </p>
      </div>

      <NotifikasiContent />
    </div>
  );
}
