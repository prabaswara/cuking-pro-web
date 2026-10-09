import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMating, getLitterByMating, getQueenDisplayName, getSireDisplayName, getCatName, mockMatings } from "@/lib/mock";
import { formatDateID, daysUntil } from "@/lib/mock";
import type { Mating } from "@/types";

interface KehamilanPageProps {
  params: Promise<{ id: string }>;
}

export default async function KehamilanPage({ params }: KehamilanPageProps) {
  await connection();
  const { id } = await params;
  const mating = getMating(id);

  if (!mating) notFound();

  const queenName = getQueenDisplayName(mating);
  const sireName = getSireDisplayName(mating);
  const litter = getLitterByMating(mating.id);
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
        <h1 className="mt-2 text-2xl font-bold text-on-surface">Kehamilan {queenName}</h1>
        <p className="mt-1 text-text-muted">Pantau perkembangan kehamilan</p>
      </div>

      {/* Header Card */}
      <div className="rounded-3xl border-sand-border bg-surface-card p-6 shadow-warm-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lavender-subtle text-tertiary">
              <span className="material-symbols-outlined text-2xl">pregnant_woman</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">{queenName}</h2>
              <p className="text-sm text-text-muted">Ayah: {sireName}</p>
              <p className="text-sm text-text-muted">Tanggal Kawin: {formatDateID(mating.matingDate)}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-lavender-subtle px-3 py-1 text-sm font-semibold text-tertiary">
            {isPregnant ? "Hamil" : isDelivered ? "Sudah Melahirkan" : "Menunggu Konfirmasi"}
          </span>
        </div>

        {isPregnant && mating.expectedDueDate && (
          <div className="mt-4 rounded-2xl bg-error-container/20 p-4 border border-error-container">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error">event</span>
                <div>
                  <p className="font-semibold text-error">Estimasi Lahir: {formatDateID(mating.expectedDueDate)}</p>
                  <p className="text-sm text-text-muted">
                    {daysUntil(mating.expectedDueDate) > 0
                      ? `Masih ${daysUntil(mating.expectedDueDate)} hari lagi`
                      : daysUntil(mating.expectedDueDate) === 0
                        ? "Hari ini!"
                        : `Terlambat ${Math.abs(daysUntil(mating.expectedDueDate))} hari`}
                  </p>
                </div>
              </div>
              {!litter && (
                <Link href={`/breeding/kehamilan/${mating.id}/lahir`}>
                  <Button className="h-10 rounded-full px-4">Catat Kelahiran</Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {litter && (
          <div className="mt-4 rounded-2xl bg-mint-subtle p-4 border border-soft-mint">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">cradle</span>
                <div>
                  <p className="font-semibold text-secondary">Lahir: {formatDateID(litter.birthDate)}</p>
                  <p className="text-sm text-text-muted">
                    {litter.totalAlive} / {litter.totalBorn} anak hidup
                  </p>
                </div>
              </div>
              <Link href={`/breeding/litter/${litter.id}`}>
                <Button variant="outline" className="h-10 rounded-full px-4">Lihat Litter</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-3xl border-sand-border bg-surface-card p-4 shadow-warm-sm">
        <h3 className="font-bold text-on-surface">Timeline</h3>
        <div className="mt-4 space-y-4">
          <TimelineItem
            date={mating.matingDate}
            title="Kawin"
            desc={`Dengan ${sireName}`}
            icon="favorite"
            color="text-tertiary"
            bg="bg-lavender-subtle"
          />
          {isPregnant && (
            <TimelineItem
              date={mating.expectedDueDate ?? ""}
              title="Estimasi Lahir"
              desc={mating.expectedDueDate ? formatDateID(mating.expectedDueDate) : "Belum ditentukan"}
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
        </div>
      </div>

      {/* Catatan */}
      {mating.notes && (
        <div className="rounded-3xl border-sand-border bg-surface-card p-4 shadow-warm-sm">
          <h3 className="font-bold text-on-surface">Catatan</h3>
          <p className="mt-2 text-on-surface-variant">{mating.notes}</p>
        </div>
      )}

      {/* Aksi */}
      {!litter && isPregnant && (
        <div className="flex gap-3">
          <Link href={`/breeding/kehamilan/${mating.id}/lahir`}>
            <Button className="h-12 flex-1 rounded-full">Catat Kelahiran</Button>
          </Link>
          <Button variant="outline" className="h-12 flex-1 rounded-full">
            Ubah Estimasi Lahir
          </Button>
        </div>
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
    <div className="relative flex items-start gap-3 pl-8 before:absolute before:left-[10px] before:top-0 before:bottom-0 before:w-[2px] before:bg-sand-border last:before:hidden">
      <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full ${bg} ${color}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-on-surface">{title}</p>
          <span className="text-sm text-text-muted">{date ? formatDateID(date) : "-"}</span>
        </div>
        <p className="text-sm text-text-muted">{desc}</p>
      </div>
    </div>
  );
}