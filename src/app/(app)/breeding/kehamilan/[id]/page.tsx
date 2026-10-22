import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";
import { daysUntil, formatDateID } from "@/lib/date";
import { getMating } from "@/lib/matings";
import { getSession } from "@/lib/session";
import { MatingActions } from "./MatingActions";

interface KehamilanPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL = {
  pending: "Menunggu Konfirmasi",
  pregnant: "Hamil",
  not_pregnant: "Tidak Hamil",
  delivered: "Sudah Melahirkan",
} as const;

export default async function KehamilanPage({ params }: KehamilanPageProps) {
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

  const litter = mating.litter;
  const isPregnant = mating.outcome === "pregnant";
  const isDelivered = mating.outcome === "delivered";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/breeding"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Kembali ke Breeding
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">
          Kehamilan {mating.queenName}
        </h1>
        <p className="mt-1 text-text-muted">Pantau perkembangan kehamilan</p>
      </div>

      <div className="rounded-3xl border-sand-border bg-surface-card p-6 shadow-warm-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lavender-subtle text-tertiary">
              <span className="material-symbols-outlined text-2xl">
                pregnant_woman
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">
                {mating.queenName}
              </h2>
              <p className="text-sm text-text-muted">Ayah: {mating.sireName}</p>
              <p className="text-sm text-text-muted">
                Tanggal Kawin: {formatDateID(mating.matingDate)}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-lavender-subtle px-3 py-1 text-sm font-semibold text-tertiary">
            {STATUS_LABEL[mating.outcome]}
          </span>
        </div>

        {isPregnant && mating.expectedDueDate && (
          <div className="mt-4 rounded-2xl border border-error-container bg-error-container/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error">
                  event
                </span>
                <div>
                  <p className="font-semibold text-error">
                    Estimasi Lahir: {formatDateID(mating.expectedDueDate)}
                  </p>
                  <p className="text-sm text-text-muted">
                    {daysUntil(mating.expectedDueDate) > 0
                      ? `Masih ${daysUntil(mating.expectedDueDate)} hari lagi`
                      : daysUntil(mating.expectedDueDate) === 0
                        ? "Hari ini!"
                        : `Terlambat ${Math.abs(
                            daysUntil(mating.expectedDueDate),
                          )} hari`}
                  </p>
                </div>
              </div>
              {!litter && (
                <Link href={`/breeding/kehamilan/${mating.id}/lahir`}>
                  <Button className="h-10 rounded-full px-4">
                    Catat Kelahiran
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {mating.relationshipWarning && (
          <p className="mt-4 rounded-2xl border border-amber-subtle bg-amber-subtle/40 p-3 text-sm text-honey-amber">
            {mating.relationshipWarning}
          </p>
        )}

        {litter && (
          <div className="mt-4 rounded-2xl border border-soft-mint bg-mint-subtle p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  cradle
                </span>
                <div>
                  <p className="font-semibold text-secondary">
                    Lahir: {formatDateID(litter.birthDate)}
                  </p>
                  <p className="text-sm text-text-muted">
                    {litter.totalAlive} / {litter.totalBorn} anak hidup
                  </p>
                </div>
              </div>
              <Link href={`/breeding/litter/${litter.id}`}>
                <Button variant="outline" className="h-10 rounded-full px-4">
                  Lihat Litter
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border-sand-border bg-surface-card p-4 shadow-warm-sm">
        <h3 className="font-bold text-on-surface">Timeline</h3>
        <div className="mt-4 space-y-4">
          <TimelineItem
            date={mating.matingDate}
            title="Kawin"
            desc={`Dengan ${mating.sireName}`}
            icon="favorite"
            color="text-tertiary"
            bg="bg-lavender-subtle"
          />
          {isPregnant && (
            <TimelineItem
              date={mating.expectedDueDate ?? ""}
              title="Estimasi Lahir"
              desc={
                mating.expectedDueDate
                  ? formatDateID(mating.expectedDueDate)
                  : "Belum ditentukan"
              }
              icon="schedule"
              color="text-error"
              bg="bg-error-container"
            />
          )}
          {litter && (
            <TimelineItem
              date={litter.birthDate}
              title="Kelahiran"
              desc={`${litter.totalAlive} anak hidup dari ${litter.totalBorn} lahir`}
              icon="cradle"
              color="text-secondary"
              bg="bg-mint-subtle"
            />
          )}
          {mating.outcome === "not_pregnant" && (
            <TimelineItem
              date={mating.matingDate}
              title="Tidak Hamil"
              desc={mating.notes ?? "Konfirmasi negatif"}
              icon="close"
              color="text-on-surface-variant"
              bg="bg-surface-container"
            />
          )}
          {isDelivered && !litter && (
            <TimelineItem
              date={mating.matingDate}
              title="Sudah Melahirkan"
              desc="Catatan kelahiran belum tersedia"
              icon="cradle"
              color="text-secondary"
              bg="bg-mint-subtle"
            />
          )}
        </div>
      </div>

      {mating.notes && (
        <div className="rounded-3xl border-sand-border bg-surface-card p-4 shadow-warm-sm">
          <h3 className="font-bold text-on-surface">Catatan</h3>
          <p className="mt-2 text-on-surface-variant">{mating.notes}</p>
        </div>
      )}

      {!litter && (
        <MatingActions
          matingId={mating.id}
          outcome={mating.outcome}
          expectedDueDate={mating.expectedDueDate}
          hasLitter={Boolean(litter)}
        />
      )}
    </div>
  );
}

function TimelineItem({
  date,
  title,
  desc,
  icon,
  color,
  bg,
}: {
  date: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="relative flex items-start gap-3 pl-8 before:absolute before:bottom-0 before:left-[10px] before:top-0 before:w-[2px] before:bg-sand-border last:before:hidden">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg} ${color}`}
      >
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-on-surface">{title}</p>
          <span className="text-sm text-text-muted">
            {date ? formatDateID(date) : "-"}
          </span>
        </div>
        <p className="text-sm text-text-muted">{desc}</p>
      </div>
    </div>
  );
}
