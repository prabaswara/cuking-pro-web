import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { DocumentList } from "@/components/dokumen/document-list";
import { getCat } from "@/lib/cats";
import { listDocuments } from "@/lib/documents";
import { getSession } from "@/lib/session";

interface DokumenPageProps {
  params: Promise<{ id: string }>;
}

export default async function DokumenPage({ params }: DokumenPageProps) {
  await connection();
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/login");

  let cat;
  try {
    cat = await getCat(session.user.id, id);
  } catch {
    notFound();
  }

  const { items, lockedCount, windowStart } = await listDocuments(
    session.user.id,
    id,
  );

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

      <DocumentList
        catId={id}
        catName={cat.name}
        initialDocuments={items}
        lockedCount={lockedCount}
        windowStart={windowStart}
        frozen={cat.trackingStatus === "frozen"}
      />
    </div>
  );
}
