import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ApiError } from "@/lib/api-error";
import { formatDateID } from "@/lib/date";
import { getMating } from "@/lib/matings";
import { getSession } from "@/lib/session";
import { BirthForm } from "./BirthForm";

interface LahirPageProps {
  params: Promise<{ id: string }>;
}

export default async function LahirPage({ params }: LahirPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  let mating;
  try {
    mating = await getMating(session.user.id, id);
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  if (mating.litter) {
    redirect(`/breeding/litter/${mating.litter.id}`);
  }

  if (mating.outcome !== "pregnant") {
    redirect(`/breeding/kehamilan/${mating.id}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href={`/breeding/kehamilan/${mating.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Kehamilan
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">
          Catat Kelahiran
        </h1>
        <p className="mt-1 text-text-muted">
          {mating.queenName} × {mating.sireName} • Kawin{" "}
          {formatDateID(mating.matingDate)}
        </p>
      </div>

      <BirthForm
        matingId={mating.id}
        matingDate={mating.matingDate}
        expectedDueDate={mating.expectedDueDate}
        queenName={mating.queenName}
      />
    </div>
  );
}
