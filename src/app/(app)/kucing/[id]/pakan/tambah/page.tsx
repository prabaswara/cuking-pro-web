import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCat } from "@/lib/cats";
import { getSession } from "@/lib/session";
import { PakanForm } from "./PakanForm";

interface PakanPageProps {
  params: Promise<{ id: string }>;
}

export default async function PakanPage({ params }: PakanPageProps) {
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
          href={`/kucing/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke {cat.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">Catat Pakan</h1>
        <p className="mt-1 text-text-muted">Jadwal & porsi makan harian</p>
        {cat.trackingStatus === "frozen" && (
          <p className="mt-3 rounded-2xl bg-amber-subtle p-3 text-sm text-on-surface">
            Kucing ini dibekukan karena batas paket Free. Upgrade ke Pro untuk
            menambah jadwal pakan.
          </p>
        )}
      </div>

      <PakanForm catId={id} catName={cat.name} />
    </div>
  );
}
