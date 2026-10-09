import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getLitterByMating, mockLitters, getCatName } from "@/lib/mock";
import { formatDateID } from "@/lib/mock";
import type { Litter } from "@/types";

interface LitterPageProps {
  params: Promise<{ id: string }>;
}

export default async function LitterPage({ params }: LitterPageProps) {
  await connection();
  const { id } = await params;
  const litter = mockLitters.find((l) => l.id === id);

  if (!litter) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/breeding"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Breeding
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">Litter #{id.slice(-1)}</h1>
        <p className="mt-1 text-text-muted">Lahir: {formatDateID(litter.birthDate)} • {litter.totalAlive}/{litter.totalBorn} hidup</p>
      </div>

      <div className="rounded-3xl border-sand-border bg-surface-card p-6 shadow-warm-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-on-surface">Ringkasan Litter</h2>
            <p className="text-sm text-text-muted">Total lahir: {litter.totalBorn} • Hidup: {litter.totalAlive}</p>
          </div>
          <Link href={`/breeding/litter/${litter.id}/tambah-anak`}>
            <Button className="h-10 rounded-full px-4">+ Tambah Anak Kucing</Button>
          </Link>
        </div>

        {litter.notes && (
          <p className="mt-4 rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
            {litter.notes}
          </p>
        )}
      </div>

      {/* Daftar anak kucing - placeholder */}
      <div className="rounded-3xl border-sand-border bg-surface-card p-6 shadow-warm-sm">
        <h3 className="font-bold text-on-surface">Anak Kucing</h3>
        <p className="mt-4 text-center text-text-muted">
          Belum ada anak kucing yang terdaftar.
          <Link href={`/breeding/litter/${litter.id}/tambah-anak`} className="text-primary underline ml-1">
            Tambah sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}