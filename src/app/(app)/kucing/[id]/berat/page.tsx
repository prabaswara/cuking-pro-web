import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { BeratContent } from "@/components/berat/berat-content";
import { getMockCat } from "@/lib/mock";

interface BeratPageProps {
  params: Promise<{ id: string }>;
}

export default async function BeratPage({ params }: BeratPageProps) {
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
          Berat {cat.name}
        </h1>
        <p className="mt-1 text-text-muted">Pantau pertumbuhan berat badan</p>
      </div>

      <BeratContent catId={id} />
    </div>
  );
}
