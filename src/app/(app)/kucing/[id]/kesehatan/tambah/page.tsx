import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { HealthForm } from "@/components/kesehatan/health-form";
import { getMockCat } from "@/lib/mock";

interface TambahKesehatanPageProps {
  params: Promise<{ id: string }>;
}

export default async function TambahKesehatanPage({ params }: TambahKesehatanPageProps) {
  await connection();
  const { id } = await params;
  const cat = getMockCat(id);

  if (!cat) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href={`/kucing/${id}/kesehatan`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Rekam Medis
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">
          Catat Kesehatan {cat.name} 🩺
        </h1>
        <p className="mt-1 text-text-muted">
          Vaksin, obat cacing, kunjungan dokter, dan lainnya
        </p>
      </div>

      <HealthForm catId={id} />
    </div>
  );
}
