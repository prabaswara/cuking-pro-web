import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getMockCat } from "@/lib/mock";
import { JualForm } from "./JualForm";

interface JualPageProps {
  params: Promise<{ id: string }>;
}

export default async function JualPage({ params }: JualPageProps) {
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
        <h1 className="mt-2 text-2xl font-bold text-on-surface">Jual Kucing</h1>
        <p className="mt-1 text-text-muted">Catat penjualan {cat.name}</p>
      </div>

      <JualForm cat={cat} />
    </div>
  );
}