import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ApiError } from "@/lib/api-error";
import { formatDateID } from "@/lib/date";
import { getLitter } from "@/lib/litters";
import { getSession } from "@/lib/session";
import { TambahAnakForm } from "./TambahAnakForm";

interface TambahAnakPageProps {
  params: Promise<{ id: string }>;
}

export default async function TambahAnakPage({ params }: TambahAnakPageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  let litter;
  try {
    litter = await getLitter(session.user.id, id);
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  if (litter.kittens.length >= litter.totalAlive) {
    redirect(`/breeding/litter/${litter.id}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          href={`/breeding/litter/${litter.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Litter
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">
          Tambah Anak Kucing
        </h1>
        <p className="mt-1 text-text-muted">
          Litter lahir {formatDateID(litter.birthDate)} • {litter.totalAlive}{" "}
          anak hidup
        </p>
      </div>

      <TambahAnakForm
        litterId={litter.id}
        litterBirthDate={litter.birthDate}
        totalAlive={litter.totalAlive}
        registeredCount={litter.kittens.length}
        queenName={litter.queenName}
        sireName={litter.sireName}
      />
    </div>
  );
}
