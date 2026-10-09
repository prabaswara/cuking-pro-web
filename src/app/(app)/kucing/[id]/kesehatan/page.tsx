import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { KesehatanList } from "@/components/kesehatan/kesehatan-list";
import { getCatName, getMockCat } from "@/lib/mock";

interface KesehatanPageProps {
  params: Promise<{ id: string }>;
}

export default async function KesehatanPage({ params }: KesehatanPageProps) {
  await connection();
  const { id } = await params;
  const cat = getMockCat(id);

  if (!cat) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/kucing/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Profil {cat.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">
          Kesehatan {cat.name}
        </h1>
        <p className="mt-1 text-text-muted">
          Catat vaksin, obat, dan kunjungan dokter
        </p>
      </div>

      <KesehatanList catId={id} />
    </div>
  );
}
