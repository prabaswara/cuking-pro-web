import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLitterByMating, mockLitters, getMating, getQueenDisplayName, getSireDisplayName } from "@/lib/mock";
import { formatDateID } from "@/lib/mock";
import { TambahAnakForm } from "./TambahAnakForm";

interface TambahAnakPageProps {
  params: Promise<{ id: string }>;
}

export default async function TambahAnakPage({ params }: TambahAnakPageProps) {
  await connection();
  const { id } = await params;
  const litter = mockLitters.find((l) => l.id === id);

  if (!litter) notFound();

  const mating = getMating(litter.matingId);
  const queenName = mating ? getQueenDisplayName(mating) : "Ibu";
  const sireName = mating ? getSireDisplayName(mating) : "Ayah";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href={`/breeding/litter/${litter.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Litter
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">
          Tambah Anak Kucing
        </h1>
        <p className="mt-1 text-text-muted">
          Litter {queenName} × {sireName} • Lahir {formatDateID(litter.birthDate)}
        </p>
      </div>

      <TambahAnakForm litterId={litter.id} totalAlive={litter.totalAlive} queenName={queenName} sireName={sireName} />
    </div>
  );
}