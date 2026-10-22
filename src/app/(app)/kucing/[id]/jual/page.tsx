import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCat } from "@/lib/cats";
import { getActiveSaleForCat } from "@/lib/sales";
import { getOrCreateProfile } from "@/lib/profile";
import { getSession } from "@/lib/session";
import { JualForm } from "./JualForm";

interface JualPageProps {
  params: Promise<{ id: string }>;
}

export default async function JualPage({ params }: JualPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const profile = await getOrCreateProfile(userId);

  if (!profile.isBreeder) {
    redirect("/breeding");
  }

  const { id } = await params;

  let cat;
  try {
    cat = await getCat(userId, id);
  } catch {
    notFound();
  }

  if (cat.status !== "active" || cat.trackingStatus === "frozen") {
    redirect(`/kucing/${cat.id}`);
  }

  const activeSale = await getActiveSaleForCat(userId, cat.id);

  if (activeSale) {
    redirect(`/penjualan/${activeSale.id}/edit`);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/kucing/${cat.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke {cat.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">
          Jual Kucing
        </h1>
        <p className="mt-1 text-text-muted">Catat penjualan {cat.name}</p>
      </div>

      <JualForm
        cat={{
          id: cat.id,
          name: cat.name,
          breed: cat.breed,
          color: cat.color,
          birthDate: cat.birthDate,
        }}
      />
    </div>
  );
}
