import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { DocumentList } from "@/components/dokumen/document-list";
import { getMockCat } from "@/lib/mock";

interface DokumenPageProps {
  params: Promise<{ id: string }>;
}

export default async function DokumenPage({ params }: DokumenPageProps) {
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
          Dokumen {cat.name}
        </h1>
        <p className="mt-1 text-text-muted">
          Brankas sertifikat, buku vaksin, dan hasil pemeriksaan
        </p>
      </div>

      <DocumentList catId={id} catName={cat.name} />
    </div>
  );
}
