import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { HealthForm } from "@/components/kesehatan/health-form";
import { getCat } from "@/lib/cats";
import { getSession } from "@/lib/session";

interface KesehatanTambahPageProps {
  params: Promise<{ id: string }>;
}

export default async function KesehatanTambahPage({
  params,
}: KesehatanTambahPageProps) {
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

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/kucing/${id}/kesehatan`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Kesehatan {cat.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">
          Catatan Kesehatan Baru
        </h1>
        <p className="mt-1 text-text-muted">
          Catat tindakan medis & pencegahan untuk {cat.name}
        </p>
        {cat.trackingStatus === "frozen" && (
          <p className="mt-3 rounded-2xl bg-amber-subtle p-3 text-sm text-on-surface">
            Kucing ini dibekukan karena batas paket Free. Upgrade ke Pro untuk
            menambah catatan.
          </p>
        )}
      </div>

      <HealthForm catId={id} catName={cat.name} />
    </div>
  );
}
