import Link from "next/link";
import type { Cat } from "@/types";
import { formatAge } from "@/lib/mock";

interface CatCardProps {
  cat: Cat;
}

export function CatCard({ cat }: CatCardProps) {
  const isFemale = cat.sex === "female";
  const isFrozen = cat.trackingStatus === "frozen";

  return (
    <article className="flex flex-col rounded-3xl border border-sand-border bg-surface-card p-4 shadow-warm-sm transition-shadow hover:shadow-warm-md">
      <div className="flex items-start gap-3.5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-surface-container">
          <div className="flex h-full w-full items-center justify-center bg-primary/10">
            <span className="material-symbols-outlined text-3xl text-primary">
              pets
            </span>
          </div>
          <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-card text-xs shadow">
            {isFemale ? "♀" : "♂"}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <h2 className="truncate text-lg font-bold text-on-surface">
                {cat.name}
              </h2>
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  isFemale
                    ? "bg-tangerine-subtle text-primary"
                    : "bg-mint-subtle text-secondary"
                }`}
              >
                {isFemale ? "♀ Betina" : "♂ Jantan"}
              </span>
            </div>
          </div>
          <p className="mt-0.5 truncate text-sm text-text-muted">
            {cat.breed ?? "Ras belum diisi"} • {formatAge(cat.birthDate)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                cat.status === "active"
                  ? "bg-mint-subtle text-secondary"
                  : "bg-surface-container text-text-muted"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {cat.status === "active"
                ? "Aktif"
                : cat.status === "sold"
                  ? "Terjual"
                  : "Meninggal"}
            </span>
            {isFrozen && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-subtle px-2.5 py-1 text-[11px] font-semibold text-honey-amber">
                <span className="material-symbols-outlined text-[13px]">
                  lock
                </span>
                Dibekukan
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-2xl bg-surface-container-low p-2.5">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-text-muted">
            Microchip
          </span>
          <span className="mt-0.5 truncate font-mono text-sm text-on-surface">
            {cat.microchipNo ?? "-"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-text-muted">
            Warna
          </span>
          <span className="mt-0.5 truncate text-sm font-medium text-on-surface">
            {cat.color ?? "-"}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between pt-1">
        <span className="flex items-center gap-1 text-sm text-text-muted">
          <span className="material-symbols-outlined text-[15px] text-soft-mint">
            check_circle
          </span>
          {cat.trackingStatus === "tracked" ? "Dilacak" : "Hanya-baca"}
        </span>
        <Link
          href={`/kucing/${cat.id}`}
          className="inline-flex items-center gap-1 rounded-full bg-tangerine-subtle px-3 py-1.5 text-sm font-semibold text-primary transition-all hover:bg-primary-fixed active:scale-95"
        >
          Lihat Profil
          <span className="material-symbols-outlined text-base">
            arrow_forward
          </span>
        </Link>
      </div>
    </article>
  );
}
