import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getMockCat } from "@/lib/mock";
import { PakanForm } from "./PakanForm";

interface PakanPageProps {
  params: Promise<{ id: string }>;
}

export default async function PakanPage({ params }: PakanPageProps) {
  await connection();
  const { id } = await params;
  const cat = getMockCat(id);

  if (!cat) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/kucing/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke {cat.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">Catat Pakan</h1>
        <p className="mt-1 text-text-muted">Jadwal & porsi makan harian</p>
      </div>

      <PakanForm catId={id} catName={cat.name} />
    </div>
  );
}